import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const colors = {
  success: 'text-[#34d399]',
  error: 'text-[#f87171]',
  info: 'text-[#22d3ee]',
};

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 shadow-[var(--shadow-card)] animate-fade-in"
          >
            <Icon size={18} className={colors[toast.type]} />
            <p className="text-sm text-[var(--color-text)]">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              className="ml-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
