import { FormEvent, useEffect, useRef, useState } from 'react';
import { Send, Square, Sparkles } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { useChatStream } from '@/hooks/useChatStream';
import { conversationsApi } from '@/api/conversations.api';
import { getErrorMessage } from '@/api/axiosInstance';
import { useToastStore } from '@/store/toastStore';
import type { Message, Conversation } from '@/types';

const SUGGESTIONS = [
  'Explain this repository to me like I\'m a beginner.',
  'How does the authentication flow work?',
  'Where is the database schema defined?',
  'Find potential security issues.',
];

interface ChatWindowProps {
  conversation: Conversation;
  initialMessages: Message[];
  onNavigate?: (file: string, line: number) => void;
}

export function ChatWindow({ conversation, initialMessages, onNavigate }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const { isStreaming, send, stop } = useChatStream();
  const showToast = useToastStore((s) => s.show);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const prevConvId = useRef(conversation._id);

  useEffect(() => {
    if (prevConvId.current !== conversation._id) {
      // Only reset when switching to a different conversation.
      prevConvId.current = conversation._id;
      setMessages(initialMessages);
    }
  }, [initialMessages, conversation._id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSend = async (e?: FormEvent) => {
    e?.preventDefault();
    const content = input.trim();
    if (!content || isStreaming) return;

    setInput('');
    setError('');

    const userMsg: Message = {
      _id: `temp-${Date.now()}`,
      conversationId: conversation._id,
      role: 'user',
      content,
      sources: [],
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Placeholder assistant bubble that fills in while streaming
    const assistantId = `temp-ai-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        _id: assistantId,
        conversationId: conversation._id,
        role: 'assistant',
        content: '',
        sources: [],
        createdAt: new Date().toISOString(),
      },
    ]);

    const success = await send(
      conversation._id,
      content,
      (text) => {
        setMessages((prev) =>
          prev.map((m) => (m._id === assistantId ? { ...m, content: m.content + text } : m)),
        );
      },
      (saved) => {
        setMessages((prev) => prev.map((m) => (m._id === assistantId ? saved : m)));
      },
    );

    if (!success) {
      setError('Failed to generate a response. Please try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const deleteConversation = async () => {
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await conversationsApi.delete(conversation._id);
      showToast('success', 'Conversation deleted.');
      window.location.reload();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
              <Sparkles size={24} className="text-[var(--color-accent)]" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-semibold">Ask anything about this codebase</h3>
              <p className="mt-1 max-w-sm text-sm text-[var(--color-text-secondary)]">
                RepoMind searches the indexed code and answers with source references.
              </p>
            </div>
            <div className="flex max-w-md flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                    inputRef.current?.focus();
                  }}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 text-left text-sm text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-text)]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {messages.map((m) => (
              <MessageBubble key={m._id} message={m} onNavigate={onNavigate} />
            ))}
            {isStreaming && messages[messages.length - 1]?.role === 'assistant' && (
              <div className="flex items-center gap-2 px-1 text-xs text-[var(--color-text-muted)]">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
                Searching codebase & generating answer...
              </div>
            )}
            {error && <p className="text-sm text-[#f87171]">{error}</p>}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this repository... (Enter to send, Shift+Enter for newline)"
              rows={1}
              className="max-h-40 min-h-[44px] flex-1 resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
            />
            {isStreaming ? (
              <button
                type="button"
                onClick={stop}
                className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/10 text-[#f87171] transition-colors hover:bg-[#ef4444]/20"
                title="Stop generating"
              >
                <Square size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white transition-colors hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-40"
                title="Send message"
              >
                <Send size={16} />
              </button>
            )}
          </form>
          <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-[var(--color-text-muted)]">
            <span>Answers are grounded in the indexed repository code.</span>
            <button onClick={deleteConversation} className="hover:text-[#f87171]">
              Delete conversation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
