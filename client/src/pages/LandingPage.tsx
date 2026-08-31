import { Link } from 'react-router-dom';
import {
  BrainCircuit,
  ArrowRight,
  Play,
  Github,
  GitBranch,
  Database,
  Search,
  MessageSquare,
  ShieldCheck,
  Zap,
  FileCode2,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const FEATURES = [
  {
    icon: GitBranch,
    title: 'Import Any Repo',
    description: 'Paste a public GitHub URL and RepoMind clones, analyzes, and indexes it automatically.',
  },
  {
    icon: Search,
    title: 'Semantic Code Search',
    description: 'Questions are embedded and matched against indexed code with vector similarity, not keywords.',
  },
  {
    icon: MessageSquare,
    title: 'Streaming AI Chat',
    description: 'Ask natural-language questions and get source-grounded answers with citations, streamed live.',
  },
  {
    icon: Layers,
    title: 'Smart Chunking',
    description: 'Code is split at function, class, and method boundaries — not blind fixed-size slices.',
  },
  {
    icon: ShieldCheck,
    title: 'Grounded Answers',
    description: 'Every answer cites the exact files and line ranges it came from. No hallucination.',
  },
  {
    icon: Zap,
    title: 'AI Developer Tools',
    description: 'Explain, review, secure, summarize, and document any file or selected code with one click.',
  },
];

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'C#', 'Go', 'Rust',
  'Ruby', 'PHP', 'Swift', 'Kotlin', 'HTML', 'CSS', 'SQL', 'Markdown', 'JSON', 'YAML',
];

const EXAMPLES = [
  'Explain the authentication flow.',
  'Where is JWT implemented?',
  'How does the frontend communicate with the backend?',
  'Explain the database schema.',
  'Where is user registration handled?',
  'Find potential security issues.',
  'How can I add Google OAuth?',
  'What happens when a user logs in?',
];

export function LandingPage() {
  const { token } = useAuthStore();
  const primaryCta = token ? (
    <Link
      to="/dashboard"
      className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(124,58,237,0.4)] transition-all hover:bg-[#6d28d9] hover:shadow-[0_0_32px_rgba(124,58,237,0.6)]"
    >
      Go to Dashboard
      <ArrowRight size={16} />
    </Link>
  ) : (
    <Link
      to="/register"
      className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(124,58,237,0.4)] transition-all hover:bg-[#6d28d9] hover:shadow-[0_0_32px_rgba(124,58,237,0.6)]"
    >
      Analyze Repository
      <ArrowRight size={16} />
    </Link>
  );

  return (
    <div className="min-h-full bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#06b6d4]">
              <BrainCircuit size={18} className="text-white" />
            </span>
            <span className="text-sm font-bold tracking-tight">
              RepoMind <span className="gradient-text">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {token ? (
              <Link
                to="/dashboard"
                className="rounded-lg bg-[var(--color-bg-hover)] px-4 py-2 text-sm font-medium transition-colors hover:text-[var(--color-accent-2)]"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)]"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#6d28d9]"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#7c3aed]/20 to-[#06b6d4]/20 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-6 pb-24 pt-20 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
            <Sparkles size={13} className="text-[var(--color-accent)]" />
            RAG-powered · Vector search · Source citations
          </div>
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Understand Any Codebase{' '}
            <span className="gradient-text">With AI.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
            RepoMind AI turns your GitHub repository into an intelligent, conversational knowledge
            base. Import a repo, ask anything, and get answers grounded in the actual source code.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            {primaryCta}
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-6 py-3 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg-hover)]"
            >
              <Play size={16} />
              View Demo
            </a>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-xs text-[var(--color-text-muted)]">
            <span className="rounded-full border border-[var(--color-border)] px-3 py-1">MongoDB</span>
            <span className="rounded-full border border-[var(--color-border)] px-3 py-1">LangChain</span>
            <span className="rounded-full border border-[var(--color-border)] px-3 py-1">FAISS</span>
            <span className="rounded-full border border-[var(--color-border)] px-3 py-1">Gemini AI</span>
            <span className="rounded-full border border-[var(--color-border)] px-3 py-1">React + TypeScript</span>
            <span className="rounded-full border border-[var(--color-border)] px-3 py-1">Express</span>
            <span className="rounded-full border border-[var(--color-border)] px-3 py-1">JWT</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">How the RAG Pipeline Works</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-[var(--color-text-secondary)]">
            Instead of stuffing an entire repository into an LLM prompt, RepoMind indexes it once and
            retrieves only the relevant pieces for each question.
          </p>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Clone & Parse',
                desc: 'The repository is cloned, filtered, and chunked at function/class boundaries with full line metadata.',
                icon: GitBranch,
              },
              {
                step: '02',
                title: 'Embed & Index',
                desc: 'Every chunk is embedded into a high-dimensional vector and stored in a FAISS index on disk.',
                icon: Database,
              },
              {
                step: '03',
                title: 'Retrieve & Answer',
                desc: 'Your question is embedded, the nearest chunks are retrieved, and the LLM answers grounded in that context.',
                icon: BrainCircuit,
              },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div
                key={step}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 transition-all hover:border-[#3a3a4e]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7c3aed]/15">
                    <Icon size={18} className="text-[var(--color-accent)]" />
                  </span>
                  <span className="text-3xl font-extrabold text-[var(--color-bg-hover)]">{step}</span>
                </div>
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">Built for Developers</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-[var(--color-text-secondary)]">
            A premium chat workspace with a repository explorer, code viewer, and AI tools.
          </p>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 transition-all hover:border-[#3a3a4e] hover:shadow-[var(--shadow-card)]"
              >
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c3aed]/20 to-[#06b6d4]/20">
                  <Icon size={18} className="text-[var(--color-accent-2)]" />
                </span>
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example questions */}
      <section className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">Ask Your Codebase Anything</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-[var(--color-text-secondary)]">
            Every answer comes with clickable source references so you can jump straight to the code.
          </p>
          <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
            {EXAMPLES.map((q) => (
              <div
                key={q}
                className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-sm text-[var(--color-text-secondary)]"
              >
                <MessageSquare size={14} className="shrink-0 text-[var(--color-accent)]" />
                {q}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported languages */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">Supported Languages</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-[var(--color-text-secondary)]">
            Smart chunking via AST for JavaScript/TypeScript, heuristics for common languages, and a
            robust fallback for everything else.
          </p>
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2">
            {LANGUAGES.map((lang) => (
              <span
                key={lang}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-1.5 text-xs font-medium text-[var(--color-text-secondary)]"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* GitHub CTA */}
      <section className="border-t border-[var(--color-border)] py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Github size={40} className="mx-auto mb-6 text-[var(--color-accent)]" />
          <h2 className="text-3xl font-bold tracking-tight">Ready to understand your repository?</h2>
          <p className="mx-auto mt-3 max-w-lg text-[var(--color-text-secondary)]">
            Import any public GitHub repository and start a conversation with its codebase in seconds.
          </p>
          <div className="mt-8 flex justify-center">{primaryCta}</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-[var(--color-text-muted)] md:flex-row">
          <div className="flex items-center gap-2">
            <BrainCircuit size={16} className="text-[var(--color-accent)]" />
            RepoMind AI — Intelligent GitHub Codebase Assistant
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <BookOpen size={13} /> RAG pipeline
            </span>
            <span className="flex items-center gap-1">
              <FileCode2 size={13} /> Vector search
            </span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
