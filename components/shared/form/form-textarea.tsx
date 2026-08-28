'use client';

import React from 'react';
import { Textarea, type TextareaProps } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export interface FormTextareaProps extends TextareaProps {
  label?: string;
  error?: string;
  helperText?: string;
}

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || props.name || generatedId;

    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-xs font-bold text-foreground block">
            {label}
          </label>
        )}
        <Textarea
          id={inputId}
          ref={ref}
          className={cn(error && 'border-destructive focus-visible:ring-destructive/20', className)}
          {...props}
        />
        {error ? (
          <p className="text-[11px] font-semibold text-destructive">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] font-medium text-muted-foreground">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';
