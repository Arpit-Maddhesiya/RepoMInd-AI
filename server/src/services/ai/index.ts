import { GeminiProvider } from './geminiProvider.js';
import type { AIProvider } from './types.js';

let provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!provider) {
    provider = new GeminiProvider();
  }
  return provider;
}

export function setAIProviderForTest(mock: AIProvider): void {
  provider = mock;
}
