import type { RawChunk } from './babelChunker.js';

export interface FallbackChunkOptions {
  maxChunkLines?: number;
  overlapLines?: number;
}

const DEFAULT_MAX_CHUNK_LINES = 80;
const DEFAULT_OVERLAP_LINES = 8;

export function chunkLineBlock(
  filePath: string,
  content: string,
  language: string,
  options: FallbackChunkOptions = {},
): RawChunk[] {
  const maxLines = options.maxChunkLines ?? DEFAULT_MAX_CHUNK_LINES;
  const overlap = options.overlapLines ?? DEFAULT_OVERLAP_LINES;

  const lines = content.split('\n');
  const chunks: RawChunk[] = [];

  for (let start = 0; start < lines.length; start += maxLines - overlap) {
    const end = Math.min(start + maxLines, lines.length);
    const slice = lines.slice(start, end).join('\n');
    if (slice.trim().length === 0) continue;

    chunks.push({
      filePath,
      language,
      startLine: start + 1,
      endLine: end,
      symbolName: null,
      chunkType: 'line-block',
      content: slice,
    });

    if (end >= lines.length) break;
  }

  return chunks;
}
