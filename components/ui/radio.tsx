'use client';

import * as React from 'react';
import { Radio as RadioPrimitive } from '@base-ui/react/radio';
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const radioVariants = cva(
  'peer inline-flex shrink-0 items-center justify-center rounded-full border-2 border-border/80 bg-card transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:border-primary',
  {
    variants: {
      size: {
        sm: 'h-3.5 w-3.5',
        default: 'h-4 w-4',
        lg: 'h-5 w-5'
      }
    },
    defaultVariants: {
      size: 'default'
    }
  }
);

const dotSizeMap = { sm: 'h-1.5 w-1.5', default: 'h-2 w-2', lg: 'h-2.5 w-2.5' } as const;

export interface RadioGroupProps
  extends Omit<React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive>, 'onValueChange'> {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  onValueChange?: (value: string) => void;
}

export function RadioGroup({
  className,
  orientation = 'vertical',
  onValueChange,
  ...props
}: RadioGroupProps) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn(
        'flex gap-3',
        orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
        className
      )}
      onValueChange={onValueChange ? (val: unknown) => onValueChange(String(val)) : undefined}
      {...props}
    />
  );
}

export interface RadioProps
  extends React.ComponentPropsWithoutRef<typeof RadioPrimitive.Root>,
    VariantProps<typeof radioVariants> {
  label?: string;
  description?: string;
}

export function Radio({
  className,
  size = 'default',
  label,
  description,
  id,
  ...props
}: RadioProps) {
  const generatedId = React.useId();
  const radioId = id || generatedId;
  const dotSize = dotSizeMap[size || 'default'];

  const radio = (
    <RadioPrimitive.Root
      id={radioId}
      data-slot="radio"
      className={cn(radioVariants({ size, className }))}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-indicator"
        className="flex items-center justify-center"
      >
        <span className={cn('rounded-full bg-primary transition-transform scale-100', dotSize)} />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  );

  if (!label) return radio;

  return (
    <div className="flex items-start gap-2.5">
      {radio}
      <div className="grid gap-0.5 leading-none">
        <label
          htmlFor={radioId}
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
