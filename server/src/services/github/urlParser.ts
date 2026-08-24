export interface ParsedGithubUrl {
  owner: string;
  repo: string;
  branch: string | null;
}

const GITHUB_URL_PATTERN = /^https?:\/\/github\.com\/([^/]+)\/([^/.\s?#]+)/i;

export function parseGithubUrl(url: string): ParsedGithubUrl | null {
  const trimmed = url.trim();

  if (/^git@/.test(trimmed) || /^git:\/\//.test(trimmed)) {
    const match = trimmed.match(/github\.com[:\/]([^/]+)\/([^/\s]+?)(?:\.git)?$/i);
    if (!match) return null;
    return { owner: match[1], repo: match[2].replace(/\.git$/, ''), branch: null };
  }

  const match = trimmed.match(GITHUB_URL_PATTERN);
  if (!match) return null;

  const owner = match[1];
  const repo = match[2].replace(/\.git$/, '');

  // Extract branch from /tree/<branch> paths
  const treeMatch = trimmed.match(/\/tree\/(.+?)(?:\?|#|$)/i);
  let branch: string | null = null;
  if (treeMatch) {
    branch = treeMatch[1].replace(/\/$/, '') || null;
  }

  return { owner, repo, branch };
}

export function isGithubUrl(value: string): boolean {
  return parseGithubUrl(value) !== null;
}
