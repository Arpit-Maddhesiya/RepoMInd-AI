import { api } from './axiosInstance';
import type { User } from '@/types';

export const authApi = {
  async register(data: { name: string; email: string; password: string }) {
    const res = await api.post<{ success: true; data: { token: string; user: User } }>(
      '/auth/register',
      data,
    );
    return res.data.data;
  },

  async login(data: { email: string; password: string }) {
    const res = await api.post<{ success: true; data: { token: string; user: User } }>(
      '/auth/login',
      data,
    );
    return res.data.data;
  },

  async getMe() {
    const res = await api.get<{ success: true; data: { user: User } }>('/auth/me');
    return res.data.data.user;
  },

  async logout() {
    await api.post('/auth/logout');
  },
};
