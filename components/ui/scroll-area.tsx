'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ScrollAreaProps extends React.ComponentProps<'div'> {
  maxHeight?: string | number;
  orientation?: 'vertical' | 'horizontal' | 'both';
}

export function ScrollArea({
  className,
  children,
  maxHeight = '300px',
  orientation = 'vertical',
  style,
  ...props
}: ScrollAreaProps) {
  const maxH = typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight;

  return (
    <div
      data-slot="scroll-area"
      className={cn(
        'relative w-full rounded-xl',
        orientation === 'vertical' && 'overflow-y-auto overflow-x-hidden',
        orientation === 'horizontal' && 'overflow-x-auto overflow-y-hidden',
        orientation === 'both' && 'overflow-auto',
        '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5',
        '[&::-webkit-scrollbar-track]:bg-transparent',
        '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60 hover:[&::-webkit-scrollbar-thumb]:bg-border',
        'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/60',
        className
      )}
      style={{ maxHeight: maxH, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}
