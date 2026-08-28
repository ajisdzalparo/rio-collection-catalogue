'use client';

import * as React from 'react';
import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export const checkboxVariants = cva(
  'peer inline-flex shrink-0 items-center justify-center border-2 border-border/80 bg-card transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-primary data-[checked]:border-primary data-[checked]:text-primary-foreground',
  {
    variants: {
      size: {
        sm: 'h-3.5 w-3.5 rounded',
        default: 'h-4 w-4 rounded-md',
        lg: 'h-5 w-5 rounded-lg'
      }
    },
    defaultVariants: {
      size: 'default'
    }
  }
);

const iconSizeMap = { sm: 'h-2.5 w-2.5', default: 'h-3 w-3', lg: 'h-3.5 w-3.5' } as const;

export interface CheckboxProps
  extends
    React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {
  label?: string;
  description?: string;
  indeterminate?: boolean;
}

export function Checkbox({
  className,
  size = 'default',
  label,
  description,
  indeterminate,
  id,
  ...props
}: CheckboxProps) {
  const generatedId = React.useId();
  const checkboxId = id || generatedId;
  const iconSize = iconSizeMap[size || 'default'];

  const checkbox = (
    <CheckboxPrimitive.Root
      id={checkboxId}
      data-slot="checkbox"
      className={cn(checkboxVariants({ size, className }))}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        {indeterminate ? (
          <Minus className={cn(iconSize, 'stroke-3')} />
        ) : (
          <Check className={cn(iconSize, 'stroke-3')} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (!label) return checkbox;

  return (
    <div className="flex items-start gap-2.5">
      {checkbox}
      <div className="grid gap-0.5 leading-none">
        <label
          htmlFor={checkboxId}
          className="text-xs font-bold text-foreground cursor-pointer select-none leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-60"
        >
          {label}
        </label>
        {description && (
          <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
