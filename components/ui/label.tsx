'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const labelVariants = cva(
  'text-foreground font-bold select-none transition-colors peer-disabled:cursor-not-allowed peer-disabled:opacity-60',
  {
    variants: {
      size: {
        sm: 'text-[11px]',
        default: 'text-xs',
        lg: 'text-sm'
      }
    },
    defaultVariants: {
      size: 'default'
    }
  }
);

export interface LabelProps
  extends React.ComponentProps<'label'>,
    VariantProps<typeof labelVariants> {
  required?: boolean;
}

export function Label({ className, size, required, children, ...props }: LabelProps) {
  return (
    <label
      data-slot="label"
      className={cn(labelVariants({ size }), className)}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>
      )}
    </label>
  );
}
