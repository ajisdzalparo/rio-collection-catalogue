'use client';

import * as React from 'react';
import { Switch as SwitchPrimitive } from '@base-ui/react/switch';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const switchVariants = cva(
  'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-primary data-[unchecked]:bg-muted/80',
  {
    variants: {
      size: {
        sm: 'h-4 w-7',
        default: 'h-6 w-11',
        lg: 'h-7 w-13'
      }
    },
    defaultVariants: {
      size: 'default'
    }
  }
);

export const thumbVariants = cva(
  'pointer-events-none block rounded-full bg-background shadow-md ring-0 transition-transform duration-200 ease-in-out data-[unchecked]:translate-x-0',
  {
    variants: {
      size: {
        sm: 'h-3 w-3 data-[checked]:translate-x-3',
        default: 'h-5 w-5 data-[checked]:translate-x-5',
        lg: 'h-6 w-6 data-[checked]:translate-x-6'
      }
    },
    defaultVariants: {
      size: 'default'
    }
  }
);

export interface SwitchProps
  extends
    React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
    VariantProps<typeof switchVariants> {
  className?: string;
}

export function Switch({ className, size = 'default', ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(switchVariants({ size, className }))}
      {...props}
    >
      <SwitchPrimitive.Thumb data-slot="switch-thumb" className={cn(thumbVariants({ size }))} />
    </SwitchPrimitive.Root>
  );
}
