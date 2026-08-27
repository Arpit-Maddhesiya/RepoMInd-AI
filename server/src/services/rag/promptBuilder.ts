import { SYSTEM_PROMPTS } from '../ai/prompts.js';
import type { RetrievedChunk } from './retriever.js';
import type { ToolKind } from '../ai/aiToolsService.js';

export interface SourceReference {
  file: string;
  startLine: number;
  endLine: number;
  language: string;
  snippet: string;
}

const MAX_SNIPPET_CHARS = 400;

export function formatRetrievedChunk(chunk: RetrievedChunk): string {
  const header = `FILE: ${chunk.filePath}`;
  const range = chunk.startLine > 0 ? `LINES: ${chunk.startLine}-${chunk.endLine}` : '';
  const symbol = chunk.symbolName ? `SYMBOL: ${chunk.symbolName}` : '';
  return [header, range, symbol].filter(Boolean).join(' | ') + `\n\`\`\`\n${chunk.content}\n\`\`\``;
}

export function buildContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return 'No relevant code context was retrieved from the repository.';
  return chunks.map(formatRetrievedChunk).join('\n\n---\n\n');
}

export function buildSources(chunks: RetrievedChunk[]): SourceReference[] {
  return chunks.map((c) => ({
    file: c.filePath,
    startLine: c.startLine,
    endLine: c.endLine,
    language: c.language,
    snippet: c.content.slice(0, MAX_SNIPPET_CHARS),
  }));
}

export function buildRagPrompt(repoFullName: string, question: string, context: string): string {
  return [
    `Repository: ${repoFullName}`,
    ``,
    `## Retrieved Code Context`,
    ``,
    context,
    ``,
    `---`,
    ``,
    `## Question`,
    ``,
    question,
  ].join('\n');
}

export function buildToolPrompt(repoFullName: string, target: string, tool: ToolKind): string {
  return [
    `Repository: ${repoFullName}`,
    ``,
    `## Target`,
    ``,
    target,
    ``,
    `---`,
    ``,
    `Proceed with the ${tool} analysis using the target above.`,
  ].join('\n');
}

export function getSystemPrompt(kind: keyof typeof SYSTEM_PROMPTS): string {
  return SYSTEM_PROMPTS[kind];
}
