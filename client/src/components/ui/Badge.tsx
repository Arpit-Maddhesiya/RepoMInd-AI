import type { RepoStatus } from '@/types';

const statusStyles: Record<RepoStatus, string> = {
  QUEUED: 'bg-[#f59e0b]/10 text-[#fbbf24] border-[#f59e0b]/30',
  CLONING: 'bg-[#06b6d4]/10 text-[#22d3ee] border-[#06b6d4]/30',
  ANALYZING: 'bg-[#06b6d4]/10 text-[#22d3ee] border-[#06b6d4]/30',
  CHUNKING: 'bg-[#06b6d4]/10 text-[#22d3ee] border-[#06b6d4]/30',
  EMBEDDING: 'bg-[#06b6d4]/10 text-[#22d3ee] border-[#06b6d4]/30',
  INDEXING: 'bg-[#06b6d4]/10 text-[#22d3ee] border-[#06b6d4]/30',
  COMPLETED: 'bg-[#10b981]/10 text-[#34d399] border-[#10b981]/30',
  FAILED: 'bg-[#ef4444]/10 text-[#f87171] border-[#ef4444]/30',
};

const dotStyles: Record<RepoStatus, string> = {
  QUEUED: 'bg-[#f59e0b]',
  CLONING: 'bg-[#06b6d4]',
  ANALYZING: 'bg-[#06b6d4]',
  CHUNKING: 'bg-[#06b6d4]',
  EMBEDDING: 'bg-[#06b6d4]',
  INDEXING: 'bg-[#06b6d4]',
  COMPLETED: 'bg-[#10b981]',
  FAILED: 'bg-[#ef4444]',
};

export function StatusBadge({ status }: { status: RepoStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[status]}`} />
      {status}
    </span>
  );
}

export function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg-card)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-secondary)] ${className}`}
    >
      {children}
    </span>
  );
}
