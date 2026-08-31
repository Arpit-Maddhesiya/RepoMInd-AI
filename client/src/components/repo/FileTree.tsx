import { useState } from 'react';
import { ChevronRight, ChevronDown, FileCode2, Folder, FolderOpen } from 'lucide-react';
import type { FileTreeNode } from '@/types';

interface FileTreeProps {
  tree: Record<string, FileTreeNode>;
  selectedPath: string | null;
  onSelect: (node: FileTreeNode) => void;
}

function TreeBranch({
  node,
  depth,
  selectedPath,
  onSelect,
}: {
  node: FileTreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (node: FileTreeNode) => void;
}) {
  const [open, setOpen] = useState(depth < 2);
  const isDir = node.type === 'dir';

  if (isDir) {
    const children = node.children ? Object.values(node.children).sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    }) : [];

    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]"
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          {open ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
          {open ? (
            <FolderOpen size={14} className="shrink-0 text-[#f59e0b]" />
          ) : (
            <Folder size={14} className="shrink-0 text-[#f59e0b]" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {open && (
          <div>
            {children.map((child) => (
              <TreeBranch
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const selected = selectedPath === node.path;

  return (
    <button
      onClick={() => onSelect(node)}
      className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm transition-colors ${
        selected
          ? 'bg-[#7c3aed]/15 text-[var(--color-text)]'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]'
      }`}
      style={{ paddingLeft: `${depth * 14 + 26}px` }}
    >
      <FileCode2 size={14} className="shrink-0 text-[var(--color-text-muted)]" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export function FileTree({ tree, selectedPath, onSelect }: FileTreeProps) {
  const roots = Object.values(tree).sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  if (roots.length === 0) {
    return <p className="px-4 py-6 text-sm text-[var(--color-text-muted)]">No files indexed.</p>;
  }

  return (
    <div className="flex flex-col gap-0.5 py-1">
      {roots.map((node) => (
        <TreeBranch
          key={node.path}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
