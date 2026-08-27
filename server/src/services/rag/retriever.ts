import { loadFaissStore } from './vectorStore.js';
import { getAIProvider } from '../ai/index.js';
import { logger } from '../../utils/logger.js';

export interface RetrievedChunk {
  filePath: string;
  startLine: number;
  endLine: number;
  language: string;
  symbolName: string | null;
  content: string;
}

const TOP_K = 6;

/**
 * Embed the query, similarity-search the FAISS index, and return the
 * most relevant chunks with full metadata.
 */
export async function retrieveRelevantChunks(
  indexDir: string,
  query: string,
  topK = TOP_K,
): Promise<RetrievedChunk[]> {
  const provider = getAIProvider();
  const queryVector = await provider.generateEmbedding(query);

  const store = await loadFaissStore(indexDir);
  const results = await store.similaritySearchVectorWithScore(queryVector, topK);

  const chunks: RetrievedChunk[] = [];
  for (const [doc] of results) {
    const meta = doc.metadata as Record<string, unknown>;
    chunks.push({
      filePath: String(meta.filePath ?? ''),
      startLine: Number(meta.startLine ?? 0),
      endLine: Number(meta.endLine ?? 0),
      language: String(meta.language ?? 'unknown'),
      symbolName: (meta.symbolName as string | null) ?? null,
      content: doc.pageContent,
    });
  }

  // De-duplicate by (filePath, startLine)
  const seen = new Set<string>();
  const unique = chunks.filter((c) => {
    const key = `${c.filePath}:${c.startLine}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  logger.info(`Retrieved ${unique.length}/${chunks.length} unique chunks for query`);
  return unique;
}
