import {
  GoogleGenerativeAI,
  type Part,
} from '@google/generative-ai';
import { env } from '../../config/env.js';
import { AppError, ErrorCodes } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';
import type { AIProvider, ChatMessage, GenerateAnswerOptions, StreamChunk } from './types.js';

const EMBEDDING_BATCH_SIZE = 25;
const EMBEDDING_MAX_RETRIES = 4;
const EMBEDDING_BASE_DELAY_MS = 1500;

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private chatModel: string;
  private embeddingModel: string;

  constructor() {
    this.client = new GoogleGenerativeAI(env.GOOGLE_API_KEY);
    this.chatModel = env.AI_MODEL;
    this.embeddingModel = env.EMBEDDING_MODEL;
  }

  private buildMessages(systemPrompt: string, messages: ChatMessage[]) {
    const parts: Part[] = [];
    if (systemPrompt) parts.push({ text: systemPrompt });
    for (const m of messages) parts.push({ text: m.content });
    return parts;
  }

  async generateAnswer({ systemPrompt, messages, temperature = 0.2, maxOutputTokens = 2048 }: GenerateAnswerOptions): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.chatModel,
        generationConfig: { temperature, maxOutputTokens },
      });
      const result = await model.generateContent(this.buildMessages(systemPrompt, messages));
      return result.response.text();
    } catch (error) {
      logger.error('Gemini generateAnswer failed', { error });
      throw new AppError('AI generation failed. Please try again.', 502, ErrorCodes.AI_PROVIDER);
    }
  }

  async *streamAnswer({ systemPrompt, messages, temperature = 0.2, maxOutputTokens = 2048 }: GenerateAnswerOptions): AsyncIterable<StreamChunk> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.chatModel,
        generationConfig: { temperature, maxOutputTokens },
      });
      const result = await model.generateContentStream(this.buildMessages(systemPrompt, messages));
      let full = '';
      for await (const chunk of result.stream) {
        const text = chunk.text?.() ?? '';
        if (text) {
          full += text;
          yield { text };
        }
      }
      yield { text: '', done: true, content: full };
    } catch (error) {
      logger.error('Gemini streamAnswer failed', { error });
      throw new AppError('AI streaming failed. Please try again.', 502, ErrorCodes.AI_PROVIDER);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const [vec] = await this.generateEmbeddings([text]);
    return vec;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const vectors: number[][] = [];
    for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
      vectors.push(...(await this.embedBatch(batch)));
    }
    return vectors;
  }

  private async embedBatch(batch: string[]): Promise<number[][]> {
    let attempt = 0;
    while (true) {
      try {
        const model = this.client.getGenerativeModel({ model: this.embeddingModel });
        const result = await model.batchEmbedContents({
          requests: batch.map((content) => ({
            model: this.embeddingModel,
            content: { role: 'user', parts: [{ text: content }] },
          })),
        });
        return result.embeddings.map((e) => Array.from(e.values));
      } catch (error) {
        const status = (error as { status?: number }).status;
        const isRateLimit = status === 429 || status === 503 || (error as { message?: string }).message?.includes('quota');
        attempt += 1;
        if (!isRateLimit || attempt > EMBEDDING_MAX_RETRIES) {
          logger.error('Embedding batch failed', { batchSize: batch.length, attempt, error });
          throw new AppError(
            'Failed to generate embeddings. Check your AI API key and quota.',
            502,
            ErrorCodes.AI_PROVIDER,
          );
        }
        const delay = EMBEDDING_BASE_DELAY_MS * 2 ** (attempt - 1);
        logger.warn(`Embedding rate limited, retrying in ${delay}ms (attempt ${attempt})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
}
