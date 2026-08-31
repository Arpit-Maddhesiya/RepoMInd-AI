import { api } from './axiosInstance';
import type { Conversation, Message } from '@/types';

export const conversationsApi = {
  async listByRepo(repositoryId: string) {
    const res = await api.get<{ success: true; data: { conversations: Conversation[] } }>(
      `/conversations/repository/${repositoryId}`,
    );
    return res.data.data.conversations;
  },

  async create(repositoryId: string, title?: string) {
    const res = await api.post<{ success: true; data: { conversation: Conversation } }>(
      `/conversations/repository/${repositoryId}`,
      { title },
    );
    return res.data.data.conversation;
  },

  async getMessages(conversationId: string) {
    const res = await api.get<{ success: true; data: { messages: Message[] } }>(
      `/conversations/${conversationId}/messages`,
    );
    return res.data.data.messages;
  },

  async delete(conversationId: string) {
    await api.delete(`/conversations/${conversationId}`);
  },
};

/** Sends a message and streams the SSE response. */
export async function streamChatMessage(
  conversationId: string,
  content: string,
  token: string,
  onDelta: (text: string) => void,
  onDone: (message: Message) => void,
  onError: (message: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
    signal,
  });

  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => null);
    onError(err?.message ?? 'Failed to send message.');
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const handleEvent = (event: string, data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (event === 'delta' && parsed.text) {
        onDelta(parsed.text);
      } else if (event === 'done' && parsed.message) {
        onDone(parsed.message as Message);
      } else if (event === 'error') {
        onError(parsed.message ?? 'AI generation failed.');
      }
    } catch {
      // Ignore malformed frames
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';
    for (const frame of frames) {
      const lines = frame.split('\n');
      let event = 'message';
      let data = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) event = line.slice(7).trim();
        else if (line.startsWith('data: ')) data = line.slice(6);
      }
      if (data) handleEvent(event, data);
    }
  }
}
