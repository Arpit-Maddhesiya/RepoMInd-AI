import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateRagAnswer,
  generateRagAnswerStream,
} from '../services/rag/ragService.js';
import {
  retrieveRelevantChunks,
} from '../services/rag/retriever.js';
import {
  buildContext,
  buildRagPrompt,
  buildSources,
  getSystemPrompt,
} from '../services/rag/promptBuilder.js';
import { mockProvider } from './helpers/testSetup.js';

vi.mock('../services/rag/vectorStore.js', () => ({
  repositoryIndexPath: () => '/fake/index/dir',
  loadFaissStore: async () => ({
    similaritySearchVectorWithScore: async () => [
      [
        {
          pageContent: 'function login() { /* auth logic */ }',
          metadata: {
            filePath: 'src/auth/login.ts',
            startLine: 10,
            endLine: 15,
            language: 'typescript',
            symbolName: 'login',
          },
        },
        0.9,
      ],
      [
        {
          pageContent: 'const jwtSecret = process.env.JWT_SECRET;',
          metadata: {
            filePath: 'src/config/index.ts',
            startLine: 1,
            endLine: 2,
            language: 'typescript',
            symbolName: null,
          },
        },
        0.8,
      ],
      [
        {
          pageContent: 'export async function loginUser(email, password) {',
          metadata: {
            filePath: 'src/auth/login.ts',
            startLine: 20,
            endLine: 22,
            language: 'typescript',
            symbolName: 'loginUser',
          },
        },
        0.7,
      ],
    ],
  }),
}));

vi.mock('../models/Repository.model.js', () => ({
  Repository: {
    findById: async () => ({
      _id: 'repo123',
      status: 'COMPLETED',
      fullName: 'test/repo',
      owner: 'test',
      name: 'repo',
    }),
  },
}));

vi.mock('../services/ai/index.js', () => ({
  getAIProvider: () => mockProvider,
}));

describe('RAG retrieval', () => {
  it('retrieves relevant chunks and dedupes by file+line', async () => {
    const chunks = await retrieveRelevantChunks('/fake/index/dir', 'How does login work?');
    expect(chunks.length).toBeLessThanOrEqual(3);
    const uniqueKeys = new Set(chunks.map((c) => `${c.filePath}:${c.startLine}`));
    expect(uniqueKeys.size).toBe(chunks.length);
    expect(chunks.some((c) => c.filePath === 'src/auth/login.ts')).toBe(true);
  });
});

describe('RAG prompt building', () => {
  it('builds a grounded prompt with context', () => {
    const chunks = [
      {
        filePath: 'src/auth/login.ts',
        startLine: 10,
        endLine: 15,
        language: 'typescript',
        symbolName: 'login',
        content: 'function login() {}',
      },
    ];
    const context = buildContext(chunks);
    expect(context).toContain('src/auth/login.ts');
    expect(context).toContain('function login() {}');

    const prompt = buildRagPrompt('test/repo', 'How does login work?', context);
    expect(prompt).toContain('Repository: test/repo');
    expect(prompt).toContain('How does login work?');
    expect(prompt).toContain('## Retrieved Code Context');
  });

  it('builds sources with snippets', () => {
    const chunks = [
      {
        filePath: 'src/auth/login.ts',
        startLine: 10,
        endLine: 15,
        language: 'typescript',
        symbolName: 'login',
        content: 'function login() { return true; }',
      },
    ];
    const sources = buildSources(chunks);
    expect(sources[0]).toMatchObject({
      file: 'src/auth/login.ts',
      startLine: 10,
      endLine: 15,
      language: 'typescript',
    });
    expect(sources[0].snippet.length).toBeGreaterThan(0);
  });

  it('has a grounding system prompt for RAG', () => {
    const prompt = getSystemPrompt('rag');
    expect(prompt).toContain('retrieved code context');
    expect(prompt).toContain('invent');
  });
});

describe('RAG answer generation', () => {
  it('generates an answer grounded in retrieved context', async () => {
    const result = await generateRagAnswer('repo123', 'How does login work?');
    expect(result.answer.length).toBeGreaterThan(0);
    expect(result.answer).toContain('Mock answer');
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.sources[0].file).toBe('src/auth/login.ts');
  });

  it('streams deltas then completes', async () => {
    const { stream, sources } = await generateRagAnswerStream('repo123', 'Explain auth flow');
    let full = '';
    let doneChunkSeen = false;
    for await (const chunk of stream) {
      if (chunk.done) {
        doneChunkSeen = true;
        full = chunk.content ?? full;
      } else {
        full += chunk.text;
      }
    }
    expect(doneChunkSeen).toBe(true);
    expect(full.length).toBeGreaterThan(0);
    expect(sources.length).toBeGreaterThan(0);
  });
});
