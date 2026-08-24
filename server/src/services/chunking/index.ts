import type { RawChunk } from './babelChunker.js';
import { canChunkWithBabel, chunkWithBabel } from './babelChunker.js';
import { getLanguageForHeuristics, chunkWithHeuristics } from './heuristicChunker.js';
import { chunkLineBlock } from './fallbackChunker.js';

export interface ChunkFileInput {
  filePath: string;
  language: string;
  content: string;
}

/**
 * Chunks a single file into semantically meaningful pieces:
 * 1. Babel AST extraction for JS/TS-family files (function/class/method level).
 * 2. Heuristic extraction for common languages (python, go, rust, java, c/cpp...).
 * 3. Line-block fallback for everything else (markdown, json, yaml, css...).
 */
export function chunkFile({ filePath, language, content }: ChunkFileInput): RawChunk[] {
  if (canChunkWithBabel(filePath)) {
    try {
      const chunks = chunkWithBabel(filePath, content, language);
      if (chunks.length > 0) return chunks;
    } catch {
      // AST parsing failed — fall through to heuristics/fallback.
    }
  }

  const heuristicLang = getLanguageForHeuristics(language);
  if (heuristicLang) {
    const chunks = chunkWithHeuristics(filePath, content, heuristicLang);
    if (chunks.length > 0) return chunks;
  }

  return chunkLineBlock(filePath, content, language);
}
