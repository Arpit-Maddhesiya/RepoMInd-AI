import fs from 'node:fs';
import path from 'node:path';
import { simpleGit } from 'simple-git';
import { logger } from '../../utils/logger.js';
import { AppError, ErrorCodes } from '../../utils/AppError.js';

export const STORAGE_DIR = path.resolve(process.cwd(), 'storage');
export const REPOS_DIR = path.join(STORAGE_DIR, 'repos');
export const INDEXES_DIR = path.join(STORAGE_DIR, 'indexes');

export function ensureStorageDirs(): void {
  for (const dir of [STORAGE_DIR, REPOS_DIR, INDEXES_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function repoCloneDir(repositoryId: string): string {
  return path.join(REPOS_DIR, repositoryId);
}

export function repoIndexDir(repositoryId: string): string {
  return path.join(INDEXES_DIR, repositoryId);
}

export async function cloneRepository(
  githubUrl: string,
  targetDir: string,
  branch?: string | null,
): Promise<void> {
  fs.mkdirSync(targetDir, { recursive: true });
  const args: string[] = ['--depth', '1'];
  if (branch) args.push('--branch', branch);

  try {
    await simpleGit().clone(githubUrl, targetDir, args);
  } catch (error) {
    logger.error('Clone failed', { githubUrl, error });
    throw new AppError(
      'Failed to clone the repository. Make sure it is public and the URL is correct.',
      400,
      ErrorCodes.REPOSITORY_PROCESSING,
    );
  }
}

export function deleteDir(dirPath: string): void {
  fs.rmSync(dirPath, { recursive: true, force: true });
}
