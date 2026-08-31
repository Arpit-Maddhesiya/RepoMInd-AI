import { create } from 'zustand';
import { reposApi, type RepoStatusResponse } from '@/api/repos.api';
import { getErrorMessage } from '@/api/axiosInstance';
import type { Repository } from '@/types';

interface RepoState {
  repos: Repository[];
  currentRepo: Repository | null;
  isLoading: boolean;
  importRepo: (url: string) => Promise<{ success: boolean; message?: string }>;
  fetchRepos: () => Promise<void>;
  fetchRepo: (id: string) => Promise<void>;
  updateStatus: (id: string, status: RepoStatusResponse) => void;
  deleteRepo: (id: string) => Promise<void>;
  reindex: (id: string) => Promise<void>;
  clearCurrent: () => void;
}

export const useRepoStore = create<RepoState>((set, get) => ({
  repos: [],
  currentRepo: null,
  isLoading: false,

  importRepo: async (url) => {
    try {
      const repo = await reposApi.importRepo(url);
      set({ repos: [repo, ...get().repos] });
      return { success: true };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    }
  },

  fetchRepos: async () => {
    set({ isLoading: true });
    try {
      const repos = await reposApi.listRepos();
      set({ repos, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchRepo: async (id) => {
    const repo = await reposApi.getRepo(id);
    set({ currentRepo: repo });
  },

  updateStatus: (id, status) => {
    set((state) => ({
      repos: state.repos.map((r) => (r._id === id ? { ...r, ...status } : r)),
      currentRepo:
        state.currentRepo?._id === id
          ? { ...state.currentRepo, ...status }
          : state.currentRepo,
    }));
  },

  deleteRepo: async (id) => {
    await reposApi.deleteRepo(id);
    set({ repos: get().repos.filter((r) => r._id !== id) });
  },

  reindex: async (id) => {
    await reposApi.reindex(id);
    const repo = await reposApi.getRepo(id);
    set((state) => ({
      repos: state.repos.map((r) => (r._id === id ? repo : r)),
      currentRepo: state.currentRepo?._id === id ? repo : state.currentRepo,
    }));
  },

  clearCurrent: () => set({ currentRepo: null }),
}));
