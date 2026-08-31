import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/Badge';
import { KeyRound, ShieldCheck, Info } from 'lucide-react';

export function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold tracking-tight">Settings</h1>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
              <Info size={16} className="text-[var(--color-accent-2)]" />
              Account
            </h2>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed]/40 to-[#06b6d4]/40 text-lg font-bold">
                {user?.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
              <ShieldCheck size={16} className="text-[var(--color-success)]" />
              Security
            </h2>
            <div className="flex flex-wrap gap-2">
              <Badge>JWT Authentication</Badge>
              <Badge>Bcrypt password hashing</Badge>
              <Badge>Rate limiting</Badge>
              <Badge>CORS + Helmet</Badge>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
              <KeyRound size={16} className="text-[var(--color-warning)]" />
              Environment
            </h2>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
              API keys, database credentials, and secrets are stored in <code className="rounded bg-[var(--color-bg-hover)] px-1.5 py-0.5 font-mono text-xs">server/.env</code>{' '}
              and are never exposed to the frontend. Configure them in{' '}
              <code className="rounded bg-[var(--color-bg-hover)] px-1.5 py-0.5 font-mono text-xs">server/.env.example</code>.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
