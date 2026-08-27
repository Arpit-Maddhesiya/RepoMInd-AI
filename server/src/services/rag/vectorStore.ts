import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { TaskType } from '@google/generative-ai';
import { env } from '../../config/env.js';
import { AppError, ErrorCodes } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';
import { Chunk } from '../../models/Chunk.model.js';
import { repoIndexDir } from '../github/cloner.js';

export interface IndexedChunk {
  pageContent: string;
  metadata: {
    repositoryId: string;
    filePath: string;
    language: string;
    startLine: number;
    endLine: number;
    symbolName: string | null;
    chunkType: string;
    chunkId: string;
  };
}

export function getEmbeddingsModel(): GoogleGenerativeAIEmbeddings {
  return new GoogleGenerativeAIEmbeddings({
    apiKey: env.GOOGLE_API_KEY,
    model: env.EMBEDDING_MODEL,
    taskType: TaskType.RETRIEVAL_DOCUMENT,
  });
}

export async function buildFaissStore(
  repositoryId: string,
  indexDir: string,
  docs: IndexedChunk[],
): Promise<void> {
  const embeddings = getEmbeddingsModel();
  const BATCH_SIZE = 50;

  try {
    let store: FaissStore | null = null;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = docs.slice(i, i + BATCH_SIZE);
      if (!store) {
        store = await FaissStore.fromDocuments(batch, embeddings);
      } else {
        await store.addDocuments(batch);
      }
    }
    if (!store) throw new Error('No documents to index');
    await store.save(indexDir);
    logger.info(`FAISS index built: ${docs.length} chunks → ${indexDir}`);
  } catch (error) {
    logger.error('FaissStore build failed', { repositoryId, error });
    throw new AppError('Failed to build vector index.', 500, ErrorCodes.REPOSITORY_PROCESSING);
  }
}

export async function loadFaissStore(indexDir: string): Promise<FaissStore> {
  try {
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: env.GOOGLE_API_KEY,
      model: env.EMBEDDING_MODEL,
      taskType: TaskType.RETRIEVAL_QUERY,
    });
    return await FaissStore.load(indexDir, embeddings);
  } catch (error) {
    logger.error('FaissStore load failed', { indexDir, error });
    throw new AppError('Vector index not found or corrupt. Re-index the repository.', 500, ErrorCodes.REPOSITORY_PROCESSING);
  }
}

/**
 * Fetches full chunk docs (with content + line ranges) for the stored Faiss docs.
 * Looks chunks up by the chunkId embedded in metadata.
 */
type LeanChunk = NonNullable<Awaited<ReturnType<typeof Chunk.find>>[number]>;

export async function hydrateChunkDocs(faissDocs: IndexedChunk[]): Promise<LeanChunk[]> {
  const ids = faissDocs.map((d) => d.metadata.chunkId);
  const chunks = await Chunk.find({ _id: { $in: ids } }).lean();
  const byId = new Map(chunks.map((c) => [c._id.toString(), c]));
  return faissDocs
    .map((d) => byId.get(d.metadata.chunkId))
    .filter((c): c is NonNullable<(typeof chunks)[number]> => Boolean(c));
}

export function repositoryIndexPath(repoId: string): string {
  return repoIndexDir(repoId);
}
