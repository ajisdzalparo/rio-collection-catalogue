'use client';

import * as React from 'react';
import { Check, Copy, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  code: string;
  language?: string;
  filename?: string;
}

export function CodeBlock({
  code,
  language = 'tsx',
  filename,
  className,
  ...props
}: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const lines = code.trim().split('\n');

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/80 bg-[#18181B] text-zinc-100 font-mono shadow-sm',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2 text-zinc-400 font-sans">
          <Code2 className="h-4 w-4 text-zinc-300" />
          <span className="font-semibold text-zinc-200">{filename || language}</span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-2.5 py-1 text-[11px] font-bold text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-sans">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-zinc-400" />
              <span className="font-sans">Copy code</span>
            </>
          )}
        </button>
      </div>

      <div className="overflow-x-auto p-4 text-xs leading-relaxed">
        <pre className="flex">
          <code className="flex-1 font-mono text-zinc-200">
            {lines.map((line, i) => (
              <div key={i} className="whitespace-pre">
                {line || ' '}
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
