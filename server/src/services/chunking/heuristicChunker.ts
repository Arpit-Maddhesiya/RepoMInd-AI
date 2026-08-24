import type { RawChunk } from './babelChunker.js';
import type { ChunkType } from '../../models/Chunk.model.js';

interface LanguageRule {
  functionPattern: RegExp;
  classPattern: RegExp | null;
  functionName: (match: RegExpMatchArray) => string | null;
  className: (match: RegExpMatchArray) => string | null;
  blockIndent?: number;
}

const RULES: Record<string, LanguageRule> = {
  python: {
    functionPattern: /^(async\s+)?def\s+([A-Za-z_]\w*)\s*\(/,
    classPattern: /^class\s+([A-Za-z_]\w*)/,
    functionName: (m) => m[2],
    className: (m) => m[1],
    blockIndent: 4,
  },
  go: {
    functionPattern: /^func\s+(\([^)]*\)\s*)?([A-Za-z_]\w*)\s*\(/,
    classPattern: /^type\s+([A-Za-z_]\w*)\s+struct\s*\{/,
    functionName: (m) => m[2],
    className: (m) => m[1],
  },
  rust: {
    functionPattern: /^(pub\s+)?(async\s+)?fn\s+([A-Za-z_]\w*)\s*\(/,
    classPattern: /^(pub\s+)?(struct|enum|impl|trait)\s+([A-Za-z_]\w*)/,
    functionName: (m) => m[3],
    className: (m) => m[3],
  },
  java: {
    functionPattern: /^\s*(public|private|protected|static|final|synchronized|abstract|\s)*[\w<>\[\],\s]+\s+([A-Za-z_]\w*)\s*\([^;]*\)\s*\{?/,
    classPattern: /^\s*(public|final|abstract|\s)*\s*class\s+([A-Za-z_]\w*)/,
    functionName: (m) => m[2],
    className: (m) => m[2],
  },
  cpp: {
    functionPattern: /^[\w:<>,*&\s]+\([^;{}]*\)\s*(?:const\s*)?(?:\{\s*)?$/,
    classPattern: /^\s*(template\s*<[^>]*>\s*)?(class|struct)\s+([A-Za-z_]\w*)/,
    functionName: () => null,
    className: (m) => m[3],
  },
  c: {
    functionPattern: /^[\w:*\s]+\([^;{}]*\)\s*(?:\{\s*)?$/,
    classPattern: null,
    functionName: () => null,
    className: () => null,
  },
  ruby: {
    functionPattern: /^\s*def\s+([A-Za-z_]\w*[?!]?)/,
    classPattern: /^\s*class\s+([A-Za-z_:]\w*)/,
    functionName: (m) => m[1],
    className: (m) => m[1],
  },
  php: {
    functionPattern: /^\s*(public|private|protected|static|final|\s)*function\s+([A-Za-z_]\w*)\s*\(/,
    classPattern: /^\s*(abstract\s+|final\s+)*class\s+([A-Za-z_]\w*)/,
    functionName: (m) => m[2],
    className: (m) => m[2],
  },
  kotlin: {
    functionPattern: /^\s*(public|private|internal|protected|suspend|override|inline|fun\s)+fun\s+([A-Za-z_]\w*)\s*\(/,
    classPattern: /^\s*(public|private|internal|data|sealed|abstract|enum|\s)*class\s+([A-Za-z_]\w*)/,
    functionName: (m) => m[2],
    className: (m) => m[2],
  },
  swift: {
    functionPattern: /^\s*(public|private|internal|fileprivate|static|override|mutating|func\s)+func\s+([A-Za-z_]\w*)\s*\(/,
    classPattern: /^\s*(public|internal|private|final|\s)*class\s+([A-Za-z_]\w*)/,
    functionName: (m) => m[2],
    className: (m) => m[2],
  },
  csharp: {
    functionPattern: /^\s*(public|private|protected|internal|static|async|virtual|override|void|Task|bool|string|int|long|double|decimal|float|char|byte|object|var|\s)*[\w<>\[\],\s]+\s+([A-Za-z_]\w*)\s*\([^;]*\)\s*\{?/,
    classPattern: /^\s*(public|internal|private|static|sealed|abstract|partial|\s)*class\s+([A-Za-z_]\w*)/,
    functionName: (m) => m[2],
    className: (m) => m[2],
  },
};

export function getLanguageForHeuristics(language: string): string | null {
  return RULES[language] ? language : null;
}

export function chunkWithHeuristics(
  filePath: string,
  content: string,
  language: string,
): RawChunk[] {
  const rule = RULES[language];
  if (!rule) return [];

  const lines = content.split('\n');
  const chunks: RawChunk[] = [];
  const n = lines.length;

  let currentStart = 1;
  let currentSymbol: string | null = null;
  let currentType: ChunkType = 'block';

  const flush = (endLine: number) => {
    if (endLine < currentStart) return;
    chunks.push({
      filePath,
      language,
      startLine: currentStart,
      endLine,
      symbolName: currentSymbol,
      chunkType: currentType,
      content: lines.slice(currentStart - 1, endLine).join('\n'),
    });
  };

  for (let i = 0; i < n; i++) {
    const lineNo = i + 1;
    const line = lines[i];

    const isClassStart = rule.classPattern && line.match(rule.classPattern);
    const isFunctionStart = line.match(rule.functionPattern);

    if (isClassStart) {
      flush(lineNo - 1);
      currentStart = lineNo;
      currentSymbol = rule.className(isClassStart);
      currentType = 'class';
    } else if (isFunctionStart) {
      flush(lineNo - 1);
      currentStart = lineNo;
      currentSymbol = rule.functionName(isFunctionStart);
      currentType = 'function';
    } else if (
      lineNo > currentStart &&
      lineNo - currentStart > 250 &&
      line.trim() !== '' &&
      line.startsWith('    ') === false
    ) {
      // Heuristic: long logical block — split at a top-level boundary.
      flush(lineNo - 1);
      currentStart = lineNo;
      currentSymbol = null;
      currentType = 'block';
    }
  }

  flush(n);
  return chunks;
}
