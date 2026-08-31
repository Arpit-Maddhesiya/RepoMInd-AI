import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({ code, language = 'text', showLineNumbers = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border border-[var(--color-border)] bg-[#0d0d14]">
      <button
        onClick={copy}
        className="absolute right-2 top-2 z-10 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-card)] p-1.5 text-[var(--color-text-muted)] opacity-0 transition-opacity hover:text-[var(--color-text)] group-hover:opacity-100"
        aria-label="Copy code"
        title="Copy code"
      >
        {copied ? <Check size={14} className="text-[#34d399]" /> : <Copy size={14} />}
      </button>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        showLineNumbers={showLineNumbers}
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: 'transparent',
          fontSize: '0.8rem',
          fontFamily: 'var(--font-mono)',
        }}
        lineNumberStyle={{ color: '#4a4a5a', minWidth: '2.5em' }}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
