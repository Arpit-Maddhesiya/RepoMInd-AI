import { describe, it, expect } from 'vitest';
import { chunkFile } from '../services/chunking/index.js';
import { chunkWithBabel } from '../services/chunking/babelChunker.js';
import { chunkWithHeuristics } from '../services/chunking/heuristicChunker.js';
import { chunkLineBlock } from '../services/chunking/fallbackChunker.js';

describe('Babel AST chunking', () => {
  it('extracts functions, methods, and classes from TypeScript', () => {
    const content = `
import express from 'express';

export function setupRoutes(app: express.Express) {
  app.get('/', (req, res) => res.send('ok'));
}

export class AuthService {
  login(email: string, password: string) {
    return email === 'a' && password === 'b';
  }

  logout() {
    return true;
  }
}

const helper = (x: number) => x * 2;
`;
    const chunks = chunkWithBabel('src/auth.ts', content, 'typescript');
    const symbols = chunks.map((c) => `${c.symbolName}:${c.chunkType}`);

    expect(symbols).toContain('setupRoutes:function');
    expect(symbols).toContain('AuthService:class');
    expect(symbols).toContain('login:method');
    expect(symbols).toContain('logout:method');
    expect(symbols).toContain('helper:function');
  });

  it('records correct line numbers', () => {
    const content = `// line 1 comment
// line 2 comment
export function foo() {
  return 1;
}
`;
    const chunks = chunkWithBabel('foo.js', content, 'javascript');
    const foo = chunks.find((c) => c.symbolName === 'foo');
    expect(foo).toBeDefined();
    expect(foo!.startLine).toBe(3);
    expect(foo!.endLine).toBe(5);
  });

  it('handles JSX', () => {
    const content = `export function App() {
  return <div className="x">Hello</div>;
}
`;
    const chunks = chunkWithBabel('App.tsx', content, 'typescript');
    expect(chunks.some((c) => c.symbolName === 'App')).toBe(true);
  });

  it('returns empty array for unsupported files', () => {
    expect(chunkWithBabel('file.py', 'def x(): pass', 'python')).toEqual([]);
  });
});

describe('Heuristic chunking', () => {
  it('extracts Python functions and classes', () => {
    const content = `import os

def parse_url(url):
    return url.split('/')[-2:]

class RepoClient:
    def fetch(self, owner, repo):
        return owner + repo

def another():
    pass
`;
    const chunks = chunkWithHeuristics('repo.py', content, 'python');
    const symbols = chunks.map((c) => `${c.symbolName}:${c.chunkType}`);
    expect(symbols).toContain('parse_url:function');
    expect(symbols).toContain('RepoClient:class');
    expect(symbols).toContain('another:function');
  });

  it('extracts Go functions', () => {
    const content = `package main

func main() {
	fmt.Println("hi")
}

func helper(x int) int {
	return x * 2
}
`;
    const chunks = chunkWithHeuristics('main.go', content, 'go');
    const symbols = chunks.map((c) => c.symbolName);
    expect(symbols).toContain('main');
    expect(symbols).toContain('helper');
  });

  it('extracts Rust fns and impl blocks', () => {
    const content = `pub fn add(a: u32, b: u32) -> u32 {
    a + b
}

impl Calculator {
    pub fn new() -> Self {
        Self {}
    }
}
`;
    const chunks = chunkWithHeuristics('lib.rs', content, 'rust');
    const symbols = chunks.map((c) => `${c.symbolName}:${c.chunkType}`);
    expect(symbols).toContain('add:function');
    expect(symbols).toContain('Calculator:class');
  });
});

describe('Fallback line-block chunking', () => {
  it('splits long files into bounded chunks with overlap', () => {
    const content = Array.from({ length: 200 }, (_, i) => `line ${i + 1}`).join('\n');
    const chunks = chunkLineBlock('data.json', content, 'json');
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].endLine - chunks[0].startLine + 1).toBeLessThanOrEqual(80);
    expect(chunks[0].startLine).toBe(1);
    expect(chunks[chunks.length - 1].endLine).toBe(200);
  });

  it('preserves file path and language metadata', () => {
    const chunks = chunkLineBlock('README.md', '# Title\n\nBody text', 'markdown');
    expect(chunks[0].filePath).toBe('README.md');
    expect(chunks[0].language).toBe('markdown');
    expect(chunks[0].chunkType).toBe('line-block');
    expect(chunks[0].symbolName).toBeNull();
  });
});

describe('chunkFile dispatch', () => {
  it('uses Babel for TS files', () => {
    const chunks = chunkFile({
      filePath: 'src/util.ts',
      language: 'typescript',
      content: 'export function add(a: number, b: number) { return a + b; }',
    });
    expect(chunks.some((c) => c.symbolName === 'add')).toBe(true);
  });

  it('falls back to line blocks for markdown', () => {
    const chunks = chunkFile({
      filePath: 'README.md',
      language: 'markdown',
      content: '# Header\n\nParagraph with lots of text.\n',
    });
    expect(chunks[0].chunkType).toBe('line-block');
    expect(chunks[0].startLine).toBe(1);
  });

  it('never returns empty chunks for non-empty content', () => {
    const chunks = chunkFile({
      filePath: 'config.yaml',
      language: 'yaml',
      content: 'a: 1\nb: 2\nc: 3\n',
    });
    expect(chunks.length).toBeGreaterThan(0);
  });
});
