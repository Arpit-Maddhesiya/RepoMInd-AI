import { Octokit } from '@octokit/rest';
import { env } from '../../config/env.js';
import { AppError, ErrorCodes } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';

const octokit = new Octokit({ auth: env.GITHUB_TOKEN || undefined });

export interface RepoMetadata {
  owner: string;
  name: string;
  fullName: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  defaultBranch: string;
  isPrivate: boolean;
}

export async function fetchRepoMetadata(owner: string, repo: string): Promise<RepoMetadata> {
  try {
    const { data } = await octokit.repos.get({ owner, repo });
    return {
      owner: data.owner.login,
      name: data.name,
      fullName: data.full_name,
      description: data.description ?? '',
      language: data.language ?? 'Unknown',
      stars: data.stargazers_count ?? 0,
      forks: data.forks_count ?? 0,
      defaultBranch: data.default_branch ?? 'main',
      isPrivate: data.private,
    };
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status === 404) {
      throw new AppError('Repository not found. Check the URL and make sure it is public.', 404, ErrorCodes.GITHUB_API);
    }
    if (status === 403 || status === 429) {
      throw new AppError('GitHub API rate limit exceeded. Try again later or configure a GITHUB_TOKEN.', 429, ErrorCodes.RATE_LIMIT);
    }
    logger.error('GitHub metadata fetch failed', { owner, repo, error });
    throw new AppError('Failed to fetch repository metadata from GitHub.', 502, ErrorCodes.GITHUB_API);
  }
}
