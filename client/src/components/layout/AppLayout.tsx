import { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BrainCircuit, LayoutDashboard, LogOut, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface AppLayoutProps {
  children: ReactNode;
  repoSelector?: ReactNode;
}

export function AppLayout({ children, repoSelector }: AppLayoutProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-full flex-col bg-[var(--color-bg)]">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#06b6d4]">
              <BrainCircuit size={18} className="text-white" />
            </span>
            <span className="text-sm font-bold tracking-tight">
              RepoMind <span className="gradient-text">AI</span>
            </span>
          </Link>
          <div className="mx-2 h-5 w-px bg-[var(--color-border)]" />
          <nav className="flex items-center gap-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-[var(--color-bg-hover)] text-[var(--color-text)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                }`
              }
            >
              <LayoutDashboard size={15} />
              Dashboard
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-[var(--color-bg-hover)] text-[var(--color-text)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                }`
              }
            >
              <Settings size={15} />
              Settings
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {repoSelector}
          {user && (
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed]/40 to-[#06b6d4]/40 text-xs font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="hidden text-sm text-[var(--color-text-secondary)] md:block">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-error)]"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
