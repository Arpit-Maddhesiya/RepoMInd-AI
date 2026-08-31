import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden bg-[var(--color-bg)] p-4">
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#7c3aed]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#06b6d4]/20 blur-3xl" />
      <div className="relative w-full max-w-md animate-fade-in">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#06b6d4]">
            <BrainCircuit size={22} className="text-white" />
          </span>
          <span className="text-xl font-bold tracking-tight">
            RepoMind <span className="gradient-text">AI</span>
          </span>
        </Link>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 shadow-[var(--shadow-card)]">
          {children}
        </div>
      </div>
    </div>
  );
}
