import { useEffect, useState } from 'react';
import { Plus, RefreshCw, FolderGit2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { RepoCard } from '@/components/repo/RepoCard';
import { RepoImportModal } from '@/components/repo/RepoImportModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { useRepoStore } from '@/store/repoStore';
import { useToastStore } from '@/store/toastStore';
import { getErrorMessage } from '@/api/axiosInstance';

export function DashboardPage() {
  const { repos, isLoading, fetchRepos } = useRepoStore();
  const [importOpen, setImportOpen] = useState(false);
  const showToast = useToastStore((s) => s.show);

  const load = async () => {
    try {
      await fetchRepos();
    } catch (error) {
      showToast('error', getErrorMessage(error));
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCount = repos.filter((r) =>
    ['QUEUED', 'CLONING', 'ANALYZING', 'CHUNKING', 'EMBEDDING', 'INDEXING'].includes(r.status),
  ).length;

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Repositories</h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {repos.length} imported · {activeCount} processing
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => void load()} title="Refresh">
              <RefreshCw size={14} />
            </Button>
            <Button size="sm" onClick={() => setImportOpen(true)}>
              <Plus size={14} />
              Import Repository
            </Button>
          </div>
        </div>

        {isLoading && repos.length === 0 ? (
          <Spinner label="Loading repositories..." />
        ) : repos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-card)]/50">
            <EmptyState
              icon={FolderGit2}
              title="No repositories yet"
              description="Import a GitHub repository to start chatting with its codebase using RAG."
              actionLabel="Import Repository"
              onAction={() => setImportOpen(true)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {repos.map((repo) => (
              <RepoCard key={repo._id} repo={repo} />
            ))}
          </div>
        )}
      </div>

      <RepoImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => void load()}
      />
    </AppLayout>
  );
}
