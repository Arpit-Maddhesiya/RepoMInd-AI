import { setAIProviderForTest } from '../../services/ai/index.js';
import type { AIProvider, GenerateAnswerOptions } from '../../services/ai/types.js';

export const mockProvider: AIProvider = {
  generateAnswer: async ({ messages }: GenerateAnswerOptions) => {
    const last = messages[messages.length - 1]?.content ?? '';
    return `Mock answer to: ${last.slice(0, 60)}`;
  },
  streamAnswer: async function* ({ messages }: GenerateAnswerOptions) {
    const last = messages[messages.length - 1]?.content ?? '';
    const text = `Mock answer to: ${last.slice(0, 60)}`;
    yield { text: text.slice(0, 10) };
    yield { text: text.slice(10) };
    yield { text: '', done: true, content: text };
  },
  generateEmbedding: async (text: string) => {
    // Deterministic pseudo-embedding based on text length + hash
    const vec = new Array(16).fill(0).map((_, i) => {
      const h = [...text].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7);
      return ((h + i * 13) % 97) / 97 - 0.5;
    });
    return vec;
  },
  generateEmbeddings: async (texts: string[]) => {
    const out: number[][] = [];
    for (const t of texts) out.push(await mockProvider.generateEmbedding(t));
    return out;
  },
};

export function setupMockAI(): void {
  setAIProviderForTest(mockProvider);
}

// Deterministic ObjectId-style id generator for tests
export function objectId(seed: number): string {
  return seed.toString(16).padStart(24, '0');
}
