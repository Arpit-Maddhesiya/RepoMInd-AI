import { Repository, type RepoStatus } from '../../models/Repository.model.js';
import { RepoFile } from '../../models/RepoFile.model.js';
import { Chunk } from '../../models/Chunk.model.js';
import { cloneRepository, repoCloneDir, repoIndexDir, deleteDir } from '../github/cloner.js';
import { walkDirectory } from './walker.js';
import { chunkFile } from '../chunking/index.js';
import { embeddingService } from '../embeddings/embeddingService.js';
import { buildFaissStore, type IndexedChunk } from '../rag/vectorStore.js';
import { logger } from '../../utils/logger.js';
import { AppError, ErrorCodes } from '../../utils/AppError.js';

const setStatus = (repoId: string, status: RepoStatus, percent: number) =>
  Repository.updateOne(
    { _id: repoId },
    { $set: { status, 'progress.stage': status, 'progress.percent': percent } },
  );

export async function runPipeline(repositoryId: string): Promise<void> {
  const repo = await Repository.findById(repositoryId);
  if (!repo) {
    logger.warn(`Pipeline: repository ${repositoryId} not found`);
    return;
  }

  const cloneDir = repoCloneDir(repositoryId);
  const indexDir = repoIndexDir(repositoryId);

  try {
    // ── CLONING ────────────────────────────────────────────
    await setStatus(repositoryId, 'CLONING', 5);
    await cloneRepository(repo.githubUrl, cloneDir, repo.branch);

    // ── ANALYZING ──────────────────────────────────────────
    await setStatus(repositoryId, 'ANALYZING', 15);
    const walked = walkDirectory(cloneDir);
    if (walked.files.length === 0) {
      throw new AppError(
        'No supported source files found in this repository.',
        400,
        ErrorCodes.REPOSITORY_PROCESSING,
      );
    }

    await RepoFile.deleteMany({ repositoryId });
    await RepoFile.insertMany(
      walked.files.map((f) => ({
        repositoryId,
        path: f.relativePath,
        language: f.language,
        size: f.size,
        lines: f.lines,
        content: f.content,
      })),
    );

    await Repository.updateOne(
      { _id: repositoryId },
      { $set: { totalFiles: walked.totalFiles, totalLines: walked.totalLines } },
    );

    // ── CHUNKING ───────────────────────────────────────────
    await setStatus(repositoryId, 'CHUNKING', 30);
    await Chunk.deleteMany({ repositoryId });

    const allChunks = walked.files.flatMap((file) =>
      chunkFile({ filePath: file.relativePath, language: file.language, content: file.content }),
    );

    if (allChunks.length === 0) {
      throw new AppError('Chunking produced no chunks for this repository.', 400, ErrorCodes.REPOSITORY_PROCESSING);
    }

    const chunkDocs = allChunks.map((c) => ({
      repositoryId,
      filePath: c.filePath,
      language: c.language,
      startLine: c.startLine,
      endLine: c.endLine,
      symbolName: c.symbolName,
      chunkType: c.chunkType,
      content: c.content,
      embedding: null,
    }));
    const inserted = await Chunk.insertMany(chunkDocs);
    const insertedIds = inserted.map((c) => c._id.toString());

    await Repository.updateOne(
      { _id: repositoryId },
      { $set: { totalChunks: inserted.length } },
    );

    // ── EMBEDDING ──────────────────────────────────────────
    await setStatus(repositoryId, 'EMBEDDING', 45);
    const vectors = await embeddingService.embed(allChunks.map((c) => c.content));
    const embeddedDocs = vectors.map((vec, i) => ({
      chunkId: insertedIds[i],
      vector: vec,
    }));

    // Persist embeddings in batches (resume-friendly: stored per chunk).
    const EMBED_SAVE_BATCH = 50;
    for (let i = 0; i < embeddedDocs.length; i += EMBED_SAVE_BATCH) {
      const batch = embeddedDocs.slice(i, i + EMBED_SAVE_BATCH);
      await Promise.all(
        batch.map(({ chunkId, vector }) =>
          Chunk.updateOne({ _id: chunkId }, { $set: { embedding: Buffer.from(Float32Array.from(vector).buffer) } }),
        ),
      );
      const pct = 45 + Math.round(((i + batch.length) / embeddedDocs.length) * 45);
      await setStatus(repositoryId, 'EMBEDDING', pct);
    }

    // ── INDEXING ───────────────────────────────────────────
    await setStatus(repositoryId, 'INDEXING', 95);
    const indexedChunks: IndexedChunk[] = allChunks.map((c, i) => ({
      pageContent: c.content,
      metadata: {
        repositoryId,
        filePath: c.filePath,
        language: c.language,
        startLine: c.startLine,
        endLine: c.endLine,
        symbolName: c.symbolName,
        chunkType: c.chunkType,
        chunkId: insertedIds[i],
      },
    }));

    deleteDir(indexDir);
    await buildFaissStore(repositoryId, indexDir, indexedChunks);

    // ── COMPLETED ──────────────────────────────────────────
    await Repository.updateOne(
      { _id: repositoryId },
      {
        $set: {
          status: 'COMPLETED',
          'progress.stage': 'COMPLETED',
          'progress.percent': 100,
          lastIndexedAt: new Date(),
          errorMessage: null,
        },
      },
    );

    logger.info(`Repository indexed successfully: ${repo.fullName || repositoryId} (${inserted.length} chunks)`);
  } catch (error) {
    const message = error instanceof AppError ? error.message : 'Repository indexing failed unexpectedly.';
    await Repository.updateOne(
      { _id: repositoryId },
      {
        $set: {
          status: 'FAILED',
          'progress.stage': 'FAILED',
          errorMessage: message,
        },
      },
    );
    logger.error('Indexing failed', { repositoryId, error });
  } finally {
    deleteDir(cloneDir);
  }
}
