import React from 'react';
import { RupiahInput, type RupiahInputProps } from '@/components/ui/rupiah-input';
import { cn } from '@/lib/utils';

export interface FormRupiahInputProps extends RupiahInputProps {
  label?: string;
  error?: string;
  helperText?: string;
}

export const FormRupiahInput = React.forwardRef<HTMLInputElement, FormRupiahInputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-xs font-bold text-foreground">
            {label}
          </label>
        )}
        <RupiahInput
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

FormRupiahInput.displayName = 'FormRupiahInput';
