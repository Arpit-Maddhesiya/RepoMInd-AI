import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FileCode2, Sparkles, ShieldAlert, GitBranch, FileText, ListChecks, BookOpen, X } from 'lucide-react';
import { aiApi } from '@/api/ai.api';
import { getErrorMessage } from '@/api/axiosInstance';
import type { ToolKind } from '@/types';

const TOOLS: { kind: ToolKind; label: string; icon: typeof Sparkles }[] = [
  { kind: 'explain', label: 'Explain', icon: Sparkles },
  { kind: 'review', label: 'Review', icon: ListChecks },
  { kind: 'security', label: 'Security', icon: ShieldAlert },
  { kind: 'summarize', label: 'Summarize', icon: FileText },
  { kind: 'architecture', label: 'Architecture', icon: GitBranch },
  { kind: 'documentation', label: 'Docs', icon: BookOpen },
];

interface CodeViewerProps {
  repositoryId: string;
  path: string;
  language: string;
  content: string;
  onClose?: () => void;
}

export function CodeViewer({ repositoryId, path, language, content, onClose }: CodeViewerProps) {
  const [selectedText, setSelectedText] = useState('');
  const [activeTool, setActiveTool] = useState<ToolKind | null>(null);
  const [result, setResult] = useState<{ answer: string; tool: ToolKind } | null>(null);
  const [loadingTool, setLoadingTool] = useState(false);
  const [error, setError] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);

  const lines = content.split('\n');

  const captureSelection = () => {
    const selection = window.getSelection()?.toString()?.trim();
    if (selection) setSelectedText(selection);
  };

  const runTool = async (tool: ToolKind) => {
    setError('');
    setLoadingTool(true);
    setActiveTool(tool);
    setPanelOpen(true);
    try {
      const target = selectedText || content;
      const res = await aiApi.runTool(repositoryId, tool, target);
      setResult(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingTool(false);
    }
  };

  const closePanel = () => {
    setPanelOpen(false);
    setResult(null);
    setActiveTool(null);
    setError('');
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <FileCode2 size={14} className="shrink-0 text-[var(--color-text-muted)]" />
          <span className="truncate font-mono text-xs text-[var(--color-text)]">{path}</span>
          <span className="shrink-0 rounded border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--color-text-muted)]">
            {language}
          </span>
          <span className="shrink-0 text-xs text-[var(--color-text-muted)]">{lines.length} lines</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {TOOLS.map(({ kind, label, icon: Icon }) => (
            <button
              key={kind}
              onClick={() => runTool(kind)}
              disabled={loadingTool}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors disabled:opacity-50 ${
                activeTool === kind
                  ? 'bg-[#7c3aed]/20 text-[#c4b5fd]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]'
              }`}
              title={`${label}${selectedText ? ' selected code' : ' whole file'}`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
          {selectedText && (
            <button
              onClick={() => setSelectedText('')}
              className="ml-1 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              Clear selection
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="ml-1 rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]"
              title="Close file preview"
              aria-label="Close file preview"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Code */}
        <div className="min-w-0 flex-1 overflow-auto" onMouseUp={captureSelection}>
          <SyntaxHighlighter
            language={language}
            style={oneDark}
            showLineNumbers
            customStyle={{
              margin: 0,
              padding: '1rem',
              background: 'transparent',
              fontSize: '0.78rem',
              lineHeight: 1.6,
              fontFamily: 'var(--font-mono)',
              minHeight: '100%',
            }}
            lineNumberStyle={{ color: '#4a4a5a', minWidth: '2.5em' }}
            wrapLongLines
          >
            {content}
          </SyntaxHighlighter>
        </div>

        {/* AI result panel */}
        {panelOpen && (
          <div className="flex w-1/3 min-w-[320px] flex-col overflow-hidden border-l border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4 py-2.5">
              <h4 className="flex items-center gap-1.5 text-sm font-semibold capitalize text-[var(--color-text)]">
                <Sparkles size={14} className="text-[var(--color-accent)]" />
                {activeTool} {selectedText ? '(selection)' : '(file)'}
              </h4>
              <button
                onClick={closePanel}
                className="rounded p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {loadingTool && (
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
                  Analyzing...
                </div>
              )}
              {error && <p className="text-sm text-[#f87171]">{error}</p>}
              {result && (
                <div className="markdown-content">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text)]">
                    {result.answer}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
