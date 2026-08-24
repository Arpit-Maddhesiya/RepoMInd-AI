import * as babelParser from '@babel/parser';
import traverseModule from '@babel/traverse';
import type { NodePath } from '@babel/traverse';
import type { ChunkType } from '../../models/Chunk.model.js';

const traverse = (traverseModule as unknown as {
  default: typeof traverseModule;
}).default ?? (traverseModule as unknown as typeof traverseModule);

export interface RawChunk {
  filePath: string;
  language: string;
  startLine: number;
  endLine: number;
  symbolName: string | null;
  chunkType: ChunkType;
  content: string;
}

interface NodeRange {
  node: { loc?: { start: { line: number }; end: { line: number } } };
}

const SUPPORTED = new Set(['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs']);

function pathToLang(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  return ext;
}

export function canChunkWithBabel(filePath: string): boolean {
  return SUPPORTED.has(pathToLang(filePath));
}

export function chunkWithBabel(
  filePath: string,
  content: string,
  language: string,
): RawChunk[] {
  const lang = pathToLang(filePath);
  const isTs = lang === 'ts' || lang === 'tsx';
  const isJsx = lang === 'jsx' || lang === 'tsx';
  const parsePlugins = [
    'jsx',
    'typescript',
    'decorators-legacy',
    'classProperties',
    'classPrivateProperties',
    'classPrivateMethods',
    'exportDefaultFrom',
    'exportNamespaceFrom',
    'dynamicImport',
    'importMeta',
    'topLevelAwait',
    'optionalChaining',
    'nullishCoalescingOperator',
    'logicalAssignment',
  ] as babelParser.ParserPlugin[];

  let ast: { errors?: unknown[] } | null = null;
  try {
    ast = babelParser.parse(content, {
      sourceType: 'unambiguous',
      plugins: parsePlugins.filter(
        (p) =>
          p !== 'jsx' || isJsx,
      ).filter((p) => p !== 'typescript' || isTs),
      errorRecovery: true,
    }) as { errors?: unknown[] };
  } catch {
    return [];
  }
  if (!ast || (ast.errors && ast.errors.length > 0)) return [];

  const chunks: RawChunk[] = [];
  const lineRanges: { start: number; end: number; symbolName: string | null; type: ChunkType }[] = [];

  const add = (node: NodeRange['node'], symbolName: string | null, type: ChunkType) => {
    if (!node.loc) return;
    lineRanges.push({
      start: node.loc.start.line,
      end: node.loc.end.line,
      symbolName,
      type,
    });
  };

  const visitors = {
    FunctionDeclaration(path: NodePath) {
      const node = path.node as { id?: { name?: string }; loc?: { start: { line: number }; end: { line: number } } };
      add(node, node.id?.name ?? null, 'function');
    },
    FunctionExpression(path: NodePath) {
      const parent = path.parent as { type: string; id?: { type: string; name: string } };
      if (parent.type === 'VariableDeclarator' && parent.id?.type === 'Identifier') {
        add(path.node as NodeRange['node'], parent.id.name, 'function');
      }
    },
    ArrowFunctionExpression(path: NodePath) {
      const parent = path.parent as { type: string; id?: { type: string; name: string }; left?: { type: string; name: string } };
      if (parent.type === 'VariableDeclarator' && parent.id?.type === 'Identifier') {
        add(path.node as NodeRange['node'], parent.id.name, 'function');
      } else if (parent.type === 'AssignmentExpression' && parent.left?.type === 'Identifier') {
        add(path.node as NodeRange['node'], parent.left.name, 'function');
      }
    },
    ObjectMethod(path: NodePath) {
      const key = (path.node as { key?: { type: string; name?: string } }).key;
      if (key?.type === 'Identifier' && key.name) {
        add(path.node as NodeRange['node'], key.name, 'function');
      }
    },
    ClassMethod(path: NodePath) {
      const key = (path.node as { key?: { type: string; name?: string } }).key;
      if (key?.type === 'Identifier' && key.name) {
        add(path.node as NodeRange['node'], key.name, 'method');
      }
    },
    TSDeclareFunction(path: NodePath) {
      const id = (path.node as { id?: { name?: string } }).id;
      if (id?.name) add(path.node as NodeRange['node'], id.name, 'function');
    },
    ClassDeclaration(path: NodePath) {
      const node = path.node as { id?: { name?: string }; loc?: { start: { line: number }; end: { line: number } } };
      add(node, node.id?.name ?? null, 'class');
    },
    ClassExpression(path: NodePath) {
      const parent = path.parent as { type: string; id?: { type: string; name: string } };
      if (parent.type === 'VariableDeclarator' && parent.id?.type === 'Identifier') {
        add(path.node as NodeRange['node'], parent.id.name, 'class');
      }
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (traverse as any)(ast, visitors as unknown as Record<string, (path: NodePath) => void>);

  const lines = content.split('\n');
  const sorted = lineRanges.sort((a, b) => a.start - b.start);

  for (const range of sorted) {
    if (range.end - range.start > 400) continue; // skip generated/huge nodes
    const slice = lines.slice(range.start - 1, range.end).join('\n');
    chunks.push({
      filePath,
      language,
      startLine: range.start,
      endLine: range.end,
      symbolName: range.symbolName,
      chunkType: range.type,
      content: slice,
    });
  }

  return chunks;
}
