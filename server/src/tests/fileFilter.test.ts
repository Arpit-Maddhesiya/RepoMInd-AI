import { describe, it, expect } from 'vitest';
import {
  shouldIncludeFile,
  getFileLanguage,
  SUPPORTED_EXTENSIONS,
  SKIP_DIRS,
  SKIP_FILES,
  MAX_FILE_SIZE_BYTES,
} from '../services/ingestion/fileFilter.js';

describe('file filtering', () => {
  it('includes supported source files', () => {
    expect(shouldIncludeFile('src/index.ts')).toBe(true);
    expect(shouldIncludeFile('app.py')).toBe(true);
    expect(shouldIncludeFile('README.md')).toBe(true);
    expect(shouldIncludeFile('package.json')).toBe(true);
    expect(shouldIncludeFile('src/components/Button.jsx')).toBe(true);
  });

  it('excludes ignored directories', () => {
    expect(shouldIncludeFile('node_modules/lodash/index.js')).toBe(false);
    expect(shouldIncludeFile('.git/config')).toBe(false);
    expect(shouldIncludeFile('dist/bundle.js')).toBe(false);
    expect(shouldIncludeFile('build/main.js')).toBe(false);
    expect(shouldIncludeFile('coverage/lcov.info')).toBe(false);
    expect(shouldIncludeFile('__pycache__/x.pyc')).toBe(false);
    expect(shouldIncludeFile('vendor/autoload.php')).toBe(false);
  });

  it('excludes lockfiles and generated files', () => {
    expect(shouldIncludeFile('package-lock.json')).toBe(false);
    expect(shouldIncludeFile('yarn.lock')).toBe(false);
    expect(shouldIncludeFile('Cargo.lock')).toBe(false);
    expect(shouldIncludeFile('go.sum')).toBe(false);
  });

  it('excludes dotfiles and unsupported extensions', () => {
    expect(shouldIncludeFile('.env.local')).toBe(false);
    expect(shouldIncludeFile('src/.secret')).toBe(false);
    expect(shouldIncludeFile('logo.png')).toBe(false);
    expect(shouldIncludeFile('movie.mp4')).toBe(false);
    expect(shouldIncludeFile('archive.zip')).toBe(false);
    expect(shouldIncludeFile('font.woff2')).toBe(false);
  });

  it('exposes a configurable extension set', () => {
    expect(SUPPORTED_EXTENSIONS.has('ts')).toBe(true);
    expect(SUPPORTED_EXTENSIONS.has('py')).toBe(true);
    expect(SUPPORTED_EXTENSIONS.has('rs')).toBe(true);
    expect(SKIP_DIRS.has('node_modules')).toBe(true);
    expect(SKIP_FILES.has('package-lock.json')).toBe(true);
    expect(MAX_FILE_SIZE_BYTES).toBe(500 * 1024);
  });

  it('respects custom config overrides', () => {
    const config = {
      supportedExtensions: new Set(['ts', 'tsx']),
      skipDirs: new Set(['dist']),
      skipFiles: new Set(['package-lock.json']),
    };
    expect(shouldIncludeFile('src/index.ts', config)).toBe(true);
    expect(shouldIncludeFile('index.js', config)).toBe(false);
    expect(shouldIncludeFile('dist/x.ts', config)).toBe(false);
  });
});

describe('getFileLanguage', () => {
  it('maps common extensions', () => {
    expect(getFileLanguage('a.ts')).toBe('typescript');
    expect(getFileLanguage('a.js')).toBe('javascript');
    expect(getFileLanguage('a.py')).toBe('python');
    expect(getFileLanguage('a.md')).toBe('markdown');
    expect(getFileLanguage('a.yaml')).toBe('yaml');
  });

  it('falls back to plaintext', () => {
    expect(getFileLanguage('a.xyz')).toBe('plaintext');
    expect(getFileLanguage('Makefile')).toBe('plaintext');
  });
});
