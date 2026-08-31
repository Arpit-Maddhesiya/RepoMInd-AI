import { useEffect, useRef } from 'react';
import { useRepoStore } from '@/store/repoStore';
import { reposApi } from '@/api/repos.api';
import type { RepoStatus } from '@/types';

const ACTIVE_STATUSES = new Set<RepoStatus>(['QUEUED', 'CLONING', 'ANALYZING', 'CHUNKING', 'EMBEDDING', 'INDEXING']);

export function useRepoStatus(repoId: string, status: RepoStatus, enabled: boolean) {
  const updateStatus = useRepoStore((s) => s.updateStatus);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || !ACTIVE_STATUSES.has(status)) return;

    intervalRef.current = setInterval(async () => {
      try {
        const data = await reposApi.getStatus(repoId);
        updateStatus(repoId, data);
        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 2500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [repoId, status, enabled, updateStatus]);
}
