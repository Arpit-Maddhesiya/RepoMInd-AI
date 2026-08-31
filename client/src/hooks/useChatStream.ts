import { useCallback, useRef, useState } from 'react';
import { streamChatMessage } from '@/api/conversations.api';
import type { Message } from '@/types';

interface UseChatStreamResult {
  isStreaming: boolean;
  send: (
    conversationId: string,
    content: string,
    onPartial: (text: string) => void,
    onComplete: (message: Message) => void,
  ) => Promise<boolean>;
  stop: () => void;
}

export function useChatStream(): UseChatStreamResult {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (
      conversationId: string,
      content: string,
      onPartial: (text: string) => void,
      onComplete: (message: Message) => void,
    ): Promise<boolean> => {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);

      let success = false;
      await streamChatMessage(
        conversationId,
        content,
        token,
        onPartial,
        (message) => {
          success = true;
          onComplete(message);
        },
        () => {
          success = false;
        },
        controller.signal,
      );

      setIsStreaming(false);
      abortRef.current = null;
      return success;
    },
    [],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { isStreaming, send, stop };
}
