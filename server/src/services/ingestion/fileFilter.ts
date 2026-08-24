export const SUPPORTED_EXTENSIONS = new Set([
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  'py', 'java', 'cpp', 'cc', 'cxx', 'c', 'h', 'hpp',
  'go', 'rs', 'php', 'rb', 'cs', 'kt', 'swift',
  'md', 'mdx', 'json', 'yml', 'yaml', 'sql',
  'css', 'scss', 'html', 'sh', 'env', 'toml', 'xml', 'graphql',
]);

export const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', 'coverage',
  '__pycache__', 'venv', '.venv', '.idea', '.vscode', 'vendor',
  'target', 'bin', 'obj', 'storage', 'tmp', 'temp', '.cache',
  'public', 'assets', 'static', 'images', 'fonts', '.next', 'Pods',
]);

export const SKIP_FILES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb',
  'Cargo.lock', 'poetry.lock', 'Gemfile.lock', 'composer.lock',
  'go.sum', 'gradle.lockfile', 'Pipfile.lock', 'uv.lock',
]);

export const MAX_FILE_SIZE_BYTES = 500 * 1024; // 500 KB

export interface FileFilterConfig {
  supportedExtensions?: Set<string>;
  skipDirs?: Set<string>;
  skipFiles?: Set<string>;
  maxFileSizeBytes?: number;
}

export function getFileLanguage(relativePath: string): string {
  const ext = relativePath.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    py: 'python', java: 'java', cpp: 'cpp', cc: 'cpp', cxx: 'cpp',
    c: 'c', h: 'c', hpp: 'cpp', go: 'go', rs: 'rust',
    php: 'php', rb: 'ruby', cs: 'csharp', kt: 'kotlin', swift: 'swift',
    md: 'markdown', mdx: 'markdown', json: 'json', yml: 'yaml', yaml: 'yaml',
    sql: 'sql', css: 'css', scss: 'scss', html: 'html', sh: 'shell',
    env: 'dotenv', toml: 'toml', xml: 'xml', graphql: 'graphql',
  };
  return map[ext] ?? 'plaintext';
}

export function shouldIncludeFile(
  relativePath: string,
  config: FileFilterConfig = {},
): boolean {
  const {
    supportedExtensions = SUPPORTED_EXTENSIONS,
    skipDirs = SKIP_DIRS,
    skipFiles = SKIP_FILES,
  } = config;

  const segments = relativePath.split('/');
  if (segments.some((seg) => seg.startsWith('.') && seg !== '.env')) return false;

  for (const seg of segments.slice(0, -1)) {
    if (skipDirs.has(seg)) return false;
  }

  const fileName = segments[segments.length - 1];
  if (skipFiles.has(fileName)) return false;

  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex === -1) return false;
  const ext = fileName.slice(dotIndex + 1).toLowerCase();
  return supportedExtensions.has(ext);
}
