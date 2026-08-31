import { api } from './axiosInstance';
import type { Repository, RepoFile, FileTreeNode, RepoStatus } from '@/types';

export interface RepoStatusResponse {
  status: RepoStatus;
  progress: { stage: RepoStatus; percent: number };
  totalFiles: number;
  totalLines: number;
  totalChunks: number;
  errorMessage: string | null;
  lastIndexedAt: string | null;
}

export const reposApi = {
  async importRepo(githubUrl: string, branch?: string) {
    const res = await api.post<{ success: true; data: { repository: Repository } }>(
      '/repositories',
      { githubUrl, branch },
    );
    return res.data.data.repository;
  },

  async listRepos() {
    const res = await api.get<{ success: true; data: { repositories: Repository[] } }>(
      '/repositories',
    );
    return res.data.data.repositories;
  },

  async getRepo(id: string) {
    const res = await api.get<{ success: true; data: { repository: Repository } }>(
      `/repositories/${id}`,
    );
    return res.data.data.repository;
  },

  async getStatus(id: string) {
    const res = await api.get<{ success: true; data: RepoStatusResponse }>(
      `/repositories/${id}/status`,
    );
    return res.data.data;
  },

  async reindex(id: string) {
    await api.post(`/repositories/${id}/index`);
  },

  async deleteRepo(id: string) {
    await api.delete(`/repositories/${id}`);
  },

  async getTree(id: string) {
    const res = await api.get<{ success: true; data: { tree: Record<string, FileTreeNode> } }>(
      `/repositories/${id}/tree`,
    );
    return res.data.data.tree;
  },

  async getFileContent(id: string, path: string) {
    const res = await api.get<{ success: true; data: { file: RepoFile & { content: string } } }>(
      `/repositories/${id}/files/${encodeURIComponent(path)}`,
    );
    return res.data.data.file;
  },
};
