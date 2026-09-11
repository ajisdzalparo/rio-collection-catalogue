'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.ComponentProps<'textarea'> {
  resizable?: boolean;
  maxLength?: number;
  showCount?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, resizable = false, maxLength, showCount = false, value, defaultValue, onChange, ...props }, ref) => {
    const [charCount, setCharCount] = React.useState<number>(() => {
      const initialVal = value ?? defaultValue ?? '';
      return String(initialVal).length;
    });

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    return (
      <div className="relative w-full">
        <textarea
          ref={ref}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          onChange={handleChange}
          className={cn(
            'flex min-h-24 w-full rounded-lg border border-border/60 bg-card/60 px-3.5 py-2.5 text-xs shadow-2xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
            !resizable && 'resize-none',
            className
          )}
          {...props}
        />
        {showCount && maxLength !== undefined && (
          <div className="absolute right-3 bottom-2 text-[10px] font-semibold text-muted-foreground bg-card/80 px-1.5 py-0.5 rounded-md pointer-events-none border border-border/40">
            {charCount} / {maxLength}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
