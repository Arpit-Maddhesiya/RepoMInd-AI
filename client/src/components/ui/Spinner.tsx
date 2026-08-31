import { Loader2 } from 'lucide-react';

export function Spinner({ size = 24, label }: { size?: number; label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <Loader2 size={size} className="animate-spin text-[var(--color-accent)]" />
      {label && <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}
