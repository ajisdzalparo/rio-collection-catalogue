import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface FormInputProps extends React.ComponentProps<'input'> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-xs font-bold text-foreground">
            {label}
          </label>
        )}
        <Input
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

FormInput.displayName = 'FormInput';
