import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy, FileCode2 } from 'lucide-react';
import { CodeBlock } from '@/components/ui/CodeBlock';
import type { Message, SourceReference } from '@/types';

function SourceCard({
  source,
  onNavigate,
}: {
  source: SourceReference;
  onNavigate: (file: string, line: number) => void;
}) {
  return (
    <button
      onClick={() => onNavigate(source.file, source.startLine)}
      className="group w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5 text-left transition-colors hover:border-[var(--color-accent)]"
    >
      <div className="flex items-center gap-1.5">
        <FileCode2 size={12} className="shrink-0 text-[var(--color-text-muted)]" />
        <span className="truncate font-mono text-xs text-[var(--color-text)]">{source.file}</span>
      </div>
      <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
        {source.startLine > 0 ? `Lines ${source.startLine}-${source.endLine}` : '—'} · {source.language}
      </p>
      {source.snippet && (
        <p className="mt-1 line-clamp-2 font-mono text-[10px] leading-relaxed text-[var(--color-text-muted)]">
          {source.snippet}
        </p>
      )}
    </button>
  );
}

interface MessageBubbleProps {
  message: Message;
  onNavigate?: (file: string, line: number) => void;
}

export function MessageBubble({ message, onNavigate }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(true);

  if (message.role === 'user') {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] px-4 py-2.5 text-sm leading-relaxed text-white shadow-[0_2px_12px_rgba(124,58,237,0.3)]">
          {message.content}
        </div>
      </div>
    );
  }

  const copyAnswer = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div className="flex flex-col gap-2 animate-fade-in">
      <div className="rounded-2xl rounded-tl-sm border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent-2)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-2)]" />
            RepoMind AI
          </span>
          <button
            onClick={copyAnswer}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]"
            title="Copy answer"
          >
            {copied ? <Check size={12} className="text-[#34d399]" /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="markdown-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className ?? '');
                const isBlock = className?.includes('language-');
                if (isBlock) {
                  return (
                    <CodeBlock code={String(children).replace(/\n$/, '')} language={match?.[1]} />
                  );
                }
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>

      {message.sources.length > 0 && (
        <div className="pl-1">
          <button
            onClick={() => setShowSources((v) => !v)}
            className="text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            {showSources ? '▾' : '▸'} {message.sources.length} source
            {message.sources.length > 1 ? 's' : ''}
          </button>
          {showSources && (
            <div className="mt-2 grid grid-cols-1 gap-1.5 md:grid-cols-2">
              {message.sources.map((source, i) => (
                <SourceCard key={i} source={source} onNavigate={onNavigate!} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
