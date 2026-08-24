import fs from 'node:fs';
import path from 'node:path';
import { getFileLanguage, shouldIncludeFile, MAX_FILE_SIZE_BYTES } from './fileFilter.js';

export interface WalkedFile {
  absolutePath: string;
  relativePath: string;
  language: string;
  size: number;
  lines: number;
  content: string;
}

export interface WalkResult {
  files: WalkedFile[];
  totalFiles: number;
  totalLines: number;
  totalBytes: number;
}

export function walkDirectory(rootDir: string): WalkResult {
  const files: WalkedFile[] = [];
  let totalLines = 0;
  let totalBytes = 0;

  const walk = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(dir, entry.name);
      const relativePath = path.relative(rootDir, absolutePath).split(path.sep).join('/');

      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }
      if (!entry.isFile()) continue;

      const stat = fs.statSync(absolutePath);
      if (stat.size > MAX_FILE_SIZE_BYTES) continue;

      if (!shouldIncludeFile(relativePath)) continue;

      const content = readFileSafe(absolutePath);
      if (content === null) continue;

      const lines = content.split('\n').length;
      totalLines += lines;
      totalBytes += stat.size;
      files.push({
        absolutePath,
        relativePath,
        language: getFileLanguage(relativePath),
        size: stat.size,
        lines,
        content,
      });
    }
  };

  walk(rootDir);
  return { files, totalFiles: files.length, totalLines, totalBytes };
}

export function readFileSafe(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}
