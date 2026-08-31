import { create } from 'zustand';
import { authApi } from '@/api/auth.api';
import { getErrorMessage } from '@/api/axiosInstance';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isInitialized: true, token: null, user: null });
      return;
    }
    try {
      const user = await authApi.getMe();
      set({ user, token, isInitialized: true });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isInitialized: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { token, user } = await authApi.login({ email, password });
      localStorage.setItem('token', token);
      set({ token, user, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, message: getErrorMessage(error) };
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const { token, user } = await authApi.register({ name, email, password });
      localStorage.setItem('token', token);
      set({ token, user, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, message: getErrorMessage(error) };
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore — always clear local state
    }
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));
