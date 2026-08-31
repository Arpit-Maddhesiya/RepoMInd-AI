import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import type { Conversation } from '@/types';

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export function ChatSidebar({ conversations, activeId, onSelect, onNew, onDelete }: ChatSidebarProps) {
  return (
    <div className="flex h-full w-56 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
      <div className="p-3">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#6d28d9]"
        >
          <Plus size={15} />
          New Chat
        </button>
      </div>
      <div className="flex-1 overflow-auto px-2 pb-2">
        {conversations.length === 0 ? (
          <p className="px-3 py-4 text-xs text-[var(--color-text-muted)]">
            No conversations yet. Start a new chat to ask about this repository.
          </p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv._id}
              className={`group mb-0.5 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                activeId === conv._id
                  ? 'bg-[#7c3aed]/15 text-[var(--color-text)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]'
              }`}
              onClick={() => onSelect(conv._id)}
            >
              <MessageSquare size={13} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate">{conv.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv._id);
                }}
                className="shrink-0 rounded p-0.5 text-[var(--color-text-muted)] opacity-0 transition-opacity hover:text-[#f87171] group-hover:opacity-100"
                aria-label="Delete conversation"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
