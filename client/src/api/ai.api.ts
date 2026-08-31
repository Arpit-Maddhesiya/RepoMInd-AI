import { api } from './axiosInstance';
import type { ToolKind } from '@/types';

export const aiApi = {
  async runTool(repositoryId: string, tool: ToolKind, target: string) {
    const res = await api.post<{ success: true; data: { answer: string; tool: ToolKind } }>(
      `/ai/${tool}`,
      { repositoryId, tool, target },
    );
    return res.data.data;
  },
};
