import type { RepoStatus } from '@/types';

const STAGES: { status: RepoStatus; label: string; weight: number }[] = [
  { status: 'QUEUED', label: 'Queued', weight: 5 },
  { status: 'CLONING', label: 'Cloning repository', weight: 10 },
  { status: 'ANALYZING', label: 'Analyzing structure', weight: 15 },
  { status: 'CHUNKING', label: 'Chunking code', weight: 15 },
  { status: 'EMBEDDING', label: 'Generating embeddings', weight: 45 },
  { status: 'INDEXING', label: 'Building vector index', weight: 5 },
  { status: 'COMPLETED', label: 'Completed', weight: 5 },
];

export function stageProgress(status: RepoStatus): number {
  const idx = STAGES.findIndex((s) => s.status === status);
  if (idx === -1) return 0;
  return STAGES.slice(0, idx + 1).reduce((acc, s) => acc + s.weight, 0);
}

export function ProgressBar({ percent, stage }: { percent: number; stage: RepoStatus }) {
  const displayPercent = percent > 0 ? percent : stageProgress(stage);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-medium text-[var(--color-text-secondary)]">{stage}</span>
        <span className="text-[var(--color-text-muted)]">{Math.min(99, displayPercent)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg-hover)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] transition-all duration-500"
          style={{ width: `${Math.max(3, Math.min(100, displayPercent))}%` }}
        />
      </div>
    </div>
  );
}
