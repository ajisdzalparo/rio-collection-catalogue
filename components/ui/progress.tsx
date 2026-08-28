'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface ProgressProps extends React.ComponentProps<'div'> {
  value?: number;
  max?: number;
  variant?: 'default' | 'emerald' | 'amber' | 'rose' | 'gradient';
  size?: 'xs' | 'sm' | 'default' | 'lg';
  showValue?: boolean;
  label?: React.ReactNode;
  indeterminate?: boolean;
}

const variantStyles = {
  default: 'bg-primary',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  gradient: 'bg-gradient-to-r from-primary via-purple-500 to-indigo-500'
};

const sizeStyles = {
  xs: 'h-1',
  sm: 'h-1.5',
  default: 'h-2.5',
  lg: 'h-4'
};

export function Progress({
  value = 0,
  max = 100,
  variant = 'default',
  size = 'default',
  showValue = false,
  label,
  indeterminate = false,
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

  return (
    <div className={cn('w-full space-y-1.5', className)} {...props}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          {label && <span>{label}</span>}
          {showValue && !indeterminate && (
            <span className="font-mono text-foreground font-bold">{Math.round(percentage)}%</span>
          )}
        </div>
      )}

      <div
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-muted/80 shadow-inner',
          sizeStyles[size]
        )}
      >
        {indeterminate ? (
          <motion.div
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className={cn('h-full w-1/2 rounded-full', variantStyles[variant])}
          />
        ) : (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ type: 'spring', stiffness: 260, damping: 25 }}
            className={cn('h-full rounded-full transition-all', variantStyles[variant])}
          />
        )}
      </div>
    </div>
  );
}
