import { getAIProvider } from '../ai/index.js';

/**
 * Embeds texts in batches with rate-limit retry handled by the provider.
 */
export class EmbeddingService {
  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const provider = getAIProvider();
    return provider.generateEmbeddings(texts);
  }

  async embedOne(text: string): Promise<number[]> {
    const provider = getAIProvider();
    return provider.generateEmbedding(text);
  }
}

export const embeddingService = new EmbeddingService();
