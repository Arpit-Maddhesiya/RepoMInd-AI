import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Star,
  GitFork,
  FileCode2,
  RefreshCw,
  FolderGit2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ProgressBar } from '@/components/repo/ProgressBar';
import { FileTree } from '@/components/repo/FileTree';
import { CodeViewer } from '@/components/repo/CodeViewer';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { Button } from '@/components/ui/Button';
import { useRepoStore } from '@/store/repoStore';
import { useToastStore } from '@/store/toastStore';
import { useRepoStatus } from '@/hooks/useRepoStatus';
import { reposApi } from '@/api/repos.api';
import { conversationsApi } from '@/api/conversations.api';
import { getErrorMessage } from '@/api/axiosInstance';
import type { Conversation, FileTreeNode, Message } from '@/types';

export function RepositoryPage() {
  const { id } = useParams<{ id: string }>();
  const { currentRepo, fetchRepo, reindex } = useRepoStore();
  const showToast = useToastStore((s) => s.show);

  const [loading, setLoading] = useState(true);

  // Chat state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Explorer state
  const [tree, setTree] = useState<Record<string, FileTreeNode>>({});
  const [selectedFile, setSelectedFile] = useState<{ path: string; language: string; content: string } | null>(null);

  const repo = currentRepo;

  useRepoStatus(id!, repo?.status ?? 'QUEUED', true);

  // Load repo
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchRepo(id)
      .catch((e) => showToast('error', getErrorMessage(e)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Load conversations when repo is ready
  const loadConversations = useCallback(async () => {
    if (!id) return;
    try {
      const convs = await conversationsApi.listByRepo(id);
      setConversations(convs);
      if (convs.length > 0 && !activeConvId) {
        setActiveConvId(convs[0]._id);
      }
    } catch (e) {
      showToast('error', getErrorMessage(e));
    }
  }, [id, activeConvId, showToast]);

  useEffect(() => {
    if (repo?.status === 'COMPLETED') {
      void loadConversations();
      void loadTree();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo?.status]);

  const loadTree = async () => {
    if (!id) return;
    try {
      const t = await reposApi.getTree(id);
      setTree(t);
    } catch (e) {
      showToast('error', getErrorMessage(e));
    }
  };

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConvId) return;
    setChatLoading(true);
    conversationsApi
      .getMessages(activeConvId)
      .then(setMessages)
      .catch((e) => showToast('error', getErrorMessage(e)))
      .finally(() => setChatLoading(false));
  }, [activeConvId, showToast]);

  const newConversation = async () => {
    if (!id) return;
    try {
      const conv = await conversationsApi.create(id);
      setConversations((prev) => [conv, ...prev]);
      setActiveConvId(conv._id);
      setMessages([]);
    } catch (e) {
      showToast('error', getErrorMessage(e));
    }
  };

  const deleteConversation = async (convId: string) => {
    try {
      await conversationsApi.delete(convId);
      setConversations((prev) => prev.filter((c) => c._id !== convId));
      if (activeConvId === convId) {
        setActiveConvId(null);
        setMessages([]);
      }
    } catch (e) {
      showToast('error', getErrorMessage(e));
    }
  };

  const openFile = async (node: FileTreeNode) => {
    if (node.type !== 'file' || !id) return;
    try {
      const file = await reposApi.getFileContent(id, node.path);
      setSelectedFile({ path: file.path, language: file.language, content: file.content });
    } catch (e) {
      showToast('error', getErrorMessage(e));
    }
  };

  const handleNavigate = (file: string, _line: number) => {
    // Open the cited file in the chat area (no tab switch, chat stays intact)
    void openFile({ name: file.split('/').pop()!, path: file, type: 'file' });
  };

  const handleReindex = async () => {
    if (!id) return;
    try {
      await reindex(id);
      showToast('info', 'Re-indexing started.');
    } catch (e) {
      showToast('error', getErrorMessage(e));
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <Spinner label="Loading repository..." />
      </AppLayout>
    );
  }

  if (!repo) {
    return (
      <AppLayout>
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <p className="text-[var(--color-text-secondary)]">Repository not found.</p>
          <Link to="/dashboard">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isActive = ['QUEUED', 'CLONING', 'ANALYZING', 'CHUNKING', 'EMBEDDING', 'INDEXING'].includes(
    repo.status,
  );

  const activeConversation = conversations.find((c) => c._id === activeConvId) ?? null;

  return (
    <AppLayout>
      <div className="flex h-full flex-col">
        {/* Repo header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/dashboard"
              className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]"
              title="Back to dashboard"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-sm font-semibold">{repo.fullName}</h1>
                <StatusBadge status={repo.status} />
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                <a
                  href={repo.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-[var(--color-accent-2)]"
                >
                  <ExternalLink size={11} />
                  GitHub
                </a>
                <span className="flex items-center gap-1">
                  <Star size={11} /> {repo.stars}
                </span>
                <span className="flex items-center gap-1">
                  <GitFork size={11} /> {repo.forks}
                </span>
                <span className="flex items-center gap-1">
                  <FileCode2 size={11} /> {repo.totalFiles} files
                </span>
                <span>{repo.branch}</span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isActive && <ProgressBar percent={repo.progress.percent} stage={repo.progress.stage} />}
            <Button variant="ghost" size="sm" onClick={handleReindex} title="Re-index">
              <RefreshCw size={14} />
            </Button>
          </div>
        </div>

        {/* Indexing state */}
        {isActive && (
          <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              {repo.progress.stage === 'EMBEDDING' && 'Generating embeddings... '}
              {repo.progress.stage === 'CHUNKING' && 'Chunking code intelligently... '}
              {repo.progress.stage === 'CLONING' && 'Cloning repository... '}
              {repo.progress.stage === 'INDEXING' && 'Building vector index... '}
              {repo.progress.stage === 'ANALYZING' && 'Analyzing repository structure... '}
              {repo.progress.stage === 'QUEUED' && 'Queued for indexing... '}
              ({repo.progress.percent}%)
            </p>
          </div>
        )}

        {repo.status === 'FAILED' && (
          <div className="shrink-0 border-b border-[#ef4444]/30 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#f87171]">
            Indexing failed: {repo.errorMessage}
          </div>
        )}

        {/* Ready state: tabs */}
        {repo.status === 'COMPLETED' && (
          <div className="flex min-h-0 flex-1">
            {/* Left: file explorer (always visible) */}
            <div className="flex w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
                  <FolderGit2 size={13} />
                  Explorer
                </span>
                <button
                  onClick={loadTree}
                  className="rounded p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]"
                  title="Refresh file tree"
                >
                  <RefreshCw size={12} />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-auto">
                <FileTree
                  tree={tree}
                  selectedPath={selectedFile?.path ?? null}
                  onSelect={openFile}
                />
              </div>
            </div>

            {/* Main content */}
            <div className="flex min-w-0 flex-1">
              <ChatSidebar
                conversations={conversations}
                activeId={activeConvId}
                onSelect={setActiveConvId}
                onNew={newConversation}
                onDelete={deleteConversation}
              />
              {activeConversation ? (
                <div className="flex min-w-0 flex-1">
                  <div className="min-w-0 flex-1">
                    {chatLoading ? (
                      <Spinner label="Loading messages..." />
                    ) : (
                      <ChatWindow
                        conversation={activeConversation}
                        initialMessages={messages}
                        onNavigate={handleNavigate}
                      />
                    )}
                  </div>
                  {selectedFile && (
                    <div className="w-1/3 min-w-[360px] shrink-0 border-l border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                      <CodeViewer
                        repositoryId={repo._id}
                        path={selectedFile.path}
                        language={selectedFile.language}
                        content={selectedFile.content}
                        onClose={() => setSelectedFile(null)}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
                  <FolderGit2 size={40} className="text-[var(--color-text-muted)]" />
                  <p className="text-[var(--color-text-secondary)]">
                    Start a new conversation to chat with this codebase.
                  </p>
                  <Button onClick={newConversation}>Start Chatting</Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Not ready & not failed (shouldn't happen) */}
        {!isActive && repo.status !== 'COMPLETED' && repo.status !== 'FAILED' && (
          <div className="flex flex-1 items-center justify-center">
            <Spinner label="Loading..." />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
