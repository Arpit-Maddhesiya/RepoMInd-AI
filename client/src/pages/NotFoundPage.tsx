import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-[var(--color-bg)] p-4">
      <Compass size={48} className="text-[var(--color-accent)]" />
      <h1 className="text-5xl font-extrabold tracking-tight">
        <span className="gradient-text">404</span>
      </h1>
      <p className="text-[var(--color-text-secondary)]">This page does not exist.</p>
      <Link to="/">
        <Button variant="outline">Back to Home</Button>
      </Link>
    </div>
  );
}
