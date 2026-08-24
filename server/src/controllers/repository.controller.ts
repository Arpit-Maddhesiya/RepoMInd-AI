import type { Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { z } from 'zod';
import { Repository } from '../models/Repository.model.js';
import { RepoFile } from '../models/RepoFile.model.js';
import { Chunk } from '../models/Chunk.model.js';
import { Conversation } from '../models/Conversation.model.js';
import { Message } from '../models/Message.model.js';
import { parseGithubUrl } from '../services/github/urlParser.js';
import { fetchRepoMetadata } from '../services/github/metadata.js';
import { indexingQueue } from '../services/ingestion/queue.js';
import { repoCloneDir, repoIndexDir, deleteDir, ensureStorageDirs } from '../services/github/cloner.js';
import { AppError, ErrorCodes } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';
import type { AuthRequest } from '../middleware/auth.js';

const importSchema = z.object({
  githubUrl: z.string().trim().url('Please enter a valid URL'),
  branch: z.string().trim().optional(),
});

const getUserId = (req: AuthRequest) => req.user!.id;

export const importRepository = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { githubUrl, branch } = importSchema.parse(req.body);
  const userId = getUserId(req);

  const parsed = parseGithubUrl(githubUrl);
  if (!parsed) {
    throw new AppError('Invalid GitHub URL. Use the format https://github.com/owner/repo', 400, ErrorCodes.VALIDATION);
  }

  const canonicalUrl = `https://github.com/${parsed.owner}/${parsed.repo}`;
  const existing = await Repository.findOne({ userId, githubUrl: canonicalUrl });
  if (existing) {
    throw new AppError('This repository is already imported.', 409, ErrorCodes.CONFLICT);
  }

  const metadata = await fetchRepoMetadata(parsed.owner, parsed.repo);
  if (metadata.isPrivate) {
    throw new AppError('Private repositories are not supported.', 403, ErrorCodes.FORBIDDEN);
  }

  ensureStorageDirs();
  const repo = await Repository.create({
    userId,
    githubUrl: `https://github.com/${metadata.fullName}`,
    owner: metadata.owner,
    name: metadata.name,
    fullName: metadata.fullName,
    branch: branch || metadata.defaultBranch,
    description: metadata.description,
    language: metadata.language,
    stars: metadata.stars,
    forks: metadata.forks,
    status: 'QUEUED',
  });

  indexingQueue.enqueue(repo.id);
  created(res, { repository: repo });
});

export const listRepositories = asyncHandler(async (req: AuthRequest, res: Response) => {
  const repos = await Repository.find({ userId: getUserId(req) }).sort({ createdAt: -1 });
  ok(res, { repositories: repos });
});

export const getRepository = asyncHandler(async (req: AuthRequest, res: Response) => {
  const repo = await Repository.findOne({ _id: req.params.id, userId: getUserId(req) });
  if (!repo) throw new AppError('Repository not found.', 404, ErrorCodes.NOT_FOUND);
  ok(res, { repository: repo });
});

export const getRepositoryStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const repo = await Repository.findOne({ _id: req.params.id, userId: getUserId(req) });
  if (!repo) throw new AppError('Repository not found.', 404, ErrorCodes.NOT_FOUND);
  ok(res, {
    status: repo.status,
    progress: repo.progress,
    totalFiles: repo.totalFiles,
    totalLines: repo.totalLines,
    totalChunks: repo.totalChunks,
    errorMessage: repo.errorMessage,
    lastIndexedAt: repo.lastIndexedAt,
  });
});

export const reindexRepository = asyncHandler(async (req: AuthRequest, res: Response) => {
  const repo = await Repository.findOne({ _id: req.params.id, userId: getUserId(req) });
  if (!repo) throw new AppError('Repository not found.', 404, ErrorCodes.NOT_FOUND);
  if (repo.status === 'QUEUED' || repo.status === 'CLONING' || repo.status === 'EMBEDDING') {
    throw new AppError('Repository is already being processed.', 409, ErrorCodes.CONFLICT);
  }

  await Repository.updateOne(
    { _id: repo.id },
    {
      $set: {
        status: 'QUEUED',
        'progress.stage': 'QUEUED',
        'progress.percent': 0,
        totalChunks: 0,
        errorMessage: null,
      },
    },
  );

  indexingQueue.enqueue(repo.id);
  ok(res, { message: 'Re-indexing started.' });
});

export const deleteRepository = asyncHandler(async (req: AuthRequest, res: Response) => {
  const repo = await Repository.findOneAndDelete({ _id: req.params.id, userId: getUserId(req) });
  if (!repo) throw new AppError('Repository not found.', 404, ErrorCodes.NOT_FOUND);

  const conversations = await Conversation.find({ repositoryId: repo.id });
  const conversationIds = conversations.map((c) => c.id);
  if (conversationIds.length > 0) {
    await Message.deleteMany({ conversationId: { $in: conversationIds } });
  }
  await Conversation.deleteMany({ repositoryId: repo.id });
  await Chunk.deleteMany({ repositoryId: repo.id });
  await RepoFile.deleteMany({ repositoryId: repo.id });
  deleteDir(repoCloneDir(repo.id));
  deleteDir(repoIndexDir(repo.id));

  ok(res, { message: 'Repository deleted.' });
});

export const listFiles = asyncHandler(async (req: AuthRequest, res: Response) => {
  const repo = await Repository.findOne({ _id: req.params.id, userId: getUserId(req) });
  if (!repo) throw new AppError('Repository not found.', 404, ErrorCodes.NOT_FOUND);

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100));
  const skip = (page - 1) * limit;

  const [files, total] = await Promise.all([
    RepoFile.find({ repositoryId: repo.id }).sort({ path: 1 }).skip(skip).limit(limit).select('-content'),
    RepoFile.countDocuments({ repositoryId: repo.id }),
  ]);

  ok(res, { files, total, page, limit });
});

export const getFileContent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const repo = await Repository.findOne({ _id: req.params.id, userId: getUserId(req) });
  if (!repo) throw new AppError('Repository not found.', 404, ErrorCodes.NOT_FOUND);

  const filePath = req.params.path as string;
  const file = await RepoFile.findOne({ repositoryId: repo.id, path: filePath });
  if (!file) throw new AppError('File not found.', 404, ErrorCodes.NOT_FOUND);

  // Prefer content stored in MongoDB at index time.
  if (file.content) {
    ok(res, { file: { ...file.toObject(), content: file.content } });
    return;
  }

  // Fallback: read from the on-disk clone (legacy repos indexed before content storage).
  const cloneDir = path.resolve(repoCloneDir(repo.id));
  const absolute = path.resolve(cloneDir, filePath);
  if (!absolute.startsWith(cloneDir + path.sep)) {
    throw new AppError('Invalid file path.', 400, ErrorCodes.VALIDATION);
  }

  if (!fs.existsSync(absolute)) {
    throw new AppError('File content is not available. Re-index the repository.', 404, ErrorCodes.NOT_FOUND);
  }
  const content = fs.readFileSync(absolute, 'utf-8');

  ok(res, { file: { ...file.toObject(), content } });
});

export const getFileTree = asyncHandler(async (req: AuthRequest, res: Response) => {
  const repo = await Repository.findOne({ _id: req.params.id, userId: getUserId(req) });
  if (!repo) throw new AppError('Repository not found.', 404, ErrorCodes.NOT_FOUND);

  const files = await RepoFile.find({ repositoryId: repo.id }).sort({ path: 1 }).select('path language size lines');

  interface TreeNode {
    name: string;
    path: string;
    type: 'file' | 'dir';
    children?: Record<string, TreeNode>;
    language?: string;
    size?: number;
    lines?: number;
  }

  const root: Record<string, TreeNode> = {};
  for (const f of files) {
    const segments = f.path.split('/');
    let level = root;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const isFile = i === segments.length - 1;
      if (!level[seg]) {
        level[seg] = isFile
          ? { name: seg, path: f.path, type: 'file', language: f.language, size: f.size, lines: f.lines }
          : { name: seg, path: segments.slice(0, i + 1).join('/'), type: 'dir', children: {} };
      }
      if (!isFile) level = level[seg].children!;
    }
  }

  ok(res, { tree: root });
});

export const getRepositoryStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const repo = await Repository.findOne({ _id: req.params.id, userId: getUserId(req) });
  if (!repo) throw new AppError('Repository not found.', 404, ErrorCodes.NOT_FOUND);

  const [totalFiles, totalChunks, filesByLang] = await Promise.all([
    RepoFile.countDocuments({ repositoryId: repo.id }),
    Chunk.countDocuments({ repositoryId: repo.id }),
    RepoFile.aggregate([
      { $match: { repositoryId: repo.id } },
      { $group: { _id: '$language', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  ok(res, {
    repository: repo,
    stats: {
      totalFiles,
      totalChunks,
      totalLines: repo.totalLines,
      languages: filesByLang.map((l) => ({ language: l._id, count: l.count })),
    },
  });
});
