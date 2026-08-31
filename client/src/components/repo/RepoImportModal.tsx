import { FormEvent, useState } from 'react';
import { Github, Link2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useRepoStore } from '@/store/repoStore';
import { useToastStore } from '@/store/toastStore';
import { getErrorMessage } from '@/api/axiosInstance';

const EXAMPLES = [
  'https://github.com/expressjs/express',
  'https://github.com/facebook/react',
  'https://github.com/microsoft/vscode',
];

interface RepoImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export function RepoImportModal({ open, onClose, onImported }: RepoImportModalProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const importRepo = useRepoStore((s) => s.importRepo);
  const showToast = useToastStore((s) => s.show);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await importRepo(url.trim());
      if (result.success) {
        showToast('success', 'Repository queued for indexing.');
        setUrl('');
        onClose();
        onImported();
      } else {
        setError(result.message ?? 'Failed to import repository.');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Import a GitHub repository">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <Link2 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repository"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 pl-10 pr-3 font-mono text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#f87171]">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setUrl(ex)}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-text)]"
            >
              <Github size={12} />
              {ex.replace('https://github.com/', '')}
            </button>
          ))}
        </div>

        <p className="text-xs text-[var(--color-text-muted)]">
          Public repositories only. The repo will be cloned, analyzed, chunked, and indexed in the
          background — you can watch progress after import.
        </p>

        <Button type="submit" loading={loading} className="mt-2">
          {loading ? 'Importing...' : 'Import Repository'}
        </Button>
      </form>
    </Modal>
  );
}
