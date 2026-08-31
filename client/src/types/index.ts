export interface User {
  id: string;
  name: string;
  email: string;
}

export type RepoStatus =
  | 'QUEUED'
  | 'CLONING'
  | 'ANALYZING'
  | 'CHUNKING'
  | 'EMBEDDING'
  | 'INDEXING'
  | 'COMPLETED'
  | 'FAILED';

export interface Repository {
  _id: string;
  userId: string;
  githubUrl: string;
  owner: string;
  name: string;
  fullName: string;
  branch: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  status: RepoStatus;
  progress: {
    stage: RepoStatus;
    percent: number;
  };
  totalFiles: number;
  totalLines: number;
  totalChunks: number;
  lastIndexedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RepoFile {
  _id: string;
  repositoryId: string;
  path: string;
  language: string;
  size: number;
  lines: number;
}

export interface SourceReference {
  file: string;
  startLine: number;
  endLine: number;
  language: string;
  snippet: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  sources: SourceReference[];
  createdAt: string;
}

export interface Conversation {
  _id: string;
  userId: string;
  repositoryId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface RepoStats {
  totalFiles: number;
  totalChunks: number;
  totalLines: number;
  languages: { language: string; count: number }[];
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: Record<string, FileTreeNode>;
  language?: string;
  size?: number;
  lines?: number;
}

export interface ApiError {
  success: false;
  message: string;
  errorCode: string;
}

export type ToolKind =
  | 'explain'
  | 'review'
  | 'security'
  | 'summarize'
  | 'architecture'
  | 'documentation';
