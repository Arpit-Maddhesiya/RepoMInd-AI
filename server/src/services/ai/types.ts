export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerateAnswerOptions {
  systemPrompt: string;
  messages: ChatMessage[];
  temperature?: number;
  maxOutputTokens?: number;
}

export interface StreamChunk {
  /** Text delta; empty when the stream ends */
  text: string;
  /** Final message content when the stream completes */
  done?: boolean;
  content?: string;
}

export interface AIProvider {
  /** Non-streaming completion, used by AI tools */
  generateAnswer(options: GenerateAnswerOptions): Promise<string>;
  /** Streaming completion with text deltas, used by chat */
  streamAnswer(options: GenerateAnswerOptions): AsyncIterable<StreamChunk>;
  /** Single text → embedding vector */
  generateEmbedding(text: string): Promise<number[]>;
  /** Batch text → embedding vectors */
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}
