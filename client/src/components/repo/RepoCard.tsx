import { Link } from 'react-router-dom';
import { Star, GitFork, FileCode2, Trash2, RefreshCw, MessageSquare } from 'lucide-react';
import type { Repository } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { useRepoStore } from '@/store/repoStore';
import { useToastStore } from '@/store/toastStore';
import { getErrorMessage } from '@/api/axiosInstance';

const langColors: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Unknown: '#8b949e',
};

export function RepoCard({ repo }: { repo: Repository }) {
  const deleteRepo = useRepoStore((s) => s.deleteRepo);
  const reindex = useRepoStore((s) => s.reindex);
  const showToast = useToastStore((s) => s.show);

  const isActive = ['QUEUED', 'CLONING', 'ANALYZING', 'CHUNKING', 'EMBEDDING', 'INDEXING'].includes(
    repo.status,
  );

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${repo.fullName}" and all its data?`)) return;
    try {
      await deleteRepo(repo._id);
      showToast('success', 'Repository deleted.');
    } catch (error) {
      showToast('error', getErrorMessage(error));
    }
  };

  const handleReindex = async () => {
    try {
      await reindex(repo._id);
      showToast('info', 'Re-indexing started.');
    } catch (error) {
      showToast('error', getErrorMessage(error));
    }
  };

  const langColor = langColors[repo.language] ?? '#8b949e';

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 transition-all duration-200 hover:border-[#3a3a4e] hover:shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/repo/${repo._id}`} className="block">
            <h3 className="truncate text-base font-semibold text-[var(--color-text)] hover:text-[var(--color-accent-2)]">
              {repo.fullName}
            </h3>
          </Link>
          {repo.description && (
            <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-secondary)]">
              {repo.description}
            </p>
          )}
        </div>
        <StatusBadge status={repo.status} />
      </div>

      {/* Progress bar while indexing */}
      {isActive && (
        <div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-hover)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] transition-all duration-500"
              style={{ width: `${Math.max(5, repo.progress.percent)}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
            {repo.progress.stage} — {repo.progress.percent}%
          </p>
        </div>
      )}

      {repo.status === 'FAILED' && repo.errorMessage && (
        <p className="rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-xs text-[#f87171]">
          {repo.errorMessage}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: langColor }}
            />
            {repo.language}
          </span>
          <span className="flex items-center gap-1">
            <Star size={12} /> {repo.stars}
          </span>
          <span className="flex items-center gap-1">
            <GitFork size={12} /> {repo.forks}
          </span>
          <span className="flex items-center gap-1">
            <FileCode2 size={12} /> {repo.totalFiles || repo.totalChunks || 0}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Link
            to={`/repo/${repo._id}`}
            className="rounded-md p-1.5 transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]"
            title="Open chat"
          >
            <MessageSquare size={14} />
          </Link>
          <button
            onClick={handleReindex}
            className="rounded-md p-1.5 transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]"
            title="Re-index"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={handleDelete}
            className="rounded-md p-1.5 transition-colors hover:bg-[#ef4444]/10 hover:text-[#f87171]"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
