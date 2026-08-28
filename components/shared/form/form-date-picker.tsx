import React from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { DatePickerProps } from '@/types/date-picker.types';
import { cn } from '@/lib/utils';

export interface FormDatePickerProps extends DatePickerProps {
  label?: string;
  error?: string;
  helperText?: string;
  id?: string;
}

export const FormDatePicker = React.forwardRef<HTMLDivElement, FormDatePickerProps>(
  ({ label, error, helperText, id, className, ...props }, ref) => {
    return (
      <div ref={ref} className="space-y-1.5 w-full">
        {label && (
          <label htmlFor={id} className="text-xs font-bold text-foreground">
            {label}
          </label>
        )}
        <DatePicker
          className={cn(error && '[&>button]:border-destructive [&>button]:focus:ring-destructive/20', className)}
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

FormDatePicker.displayName = 'FormDatePicker';
