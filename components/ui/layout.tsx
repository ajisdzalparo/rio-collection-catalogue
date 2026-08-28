'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const gridVariants = cva('grid w-full', {
  variants: {
    cols: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
      6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
      auto: 'grid-cols-[repeat(auto-fill,minmax(var(--grid-min,240px),1fr))]'
    },
    gap: {
      none: 'gap-0',
      xs: 'gap-2',
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8'
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline'
    }
  },
  defaultVariants: {
    cols: 3,
    gap: 'md',
    align: 'stretch'
  }
});

export interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {
  minChildWidth?: string;
}

export function Grid({
  className,
  cols,
  gap,
  align,
  minChildWidth,
  style,
  ...props
}: GridProps) {
  const mergedStyle = minChildWidth
    ? { ...style, '--grid-min': minChildWidth } as React.CSSProperties
    : style;

  return (
    <div
      data-slot="grid"
      className={cn(gridVariants({ cols: minChildWidth ? 'auto' : cols, gap, align }), className)}
      style={mergedStyle}
      {...props}
    />
  );
}

export const flexVariants = cva('flex w-full', {
  variants: {
    direction: {
      row: 'flex-row',
      col: 'flex-col',
      rowReverse: 'flex-row-reverse',
      colReverse: 'flex-col-reverse',
      responsive: 'flex-col sm:flex-row'
    },
    gap: {
      none: 'gap-0',
      xs: 'gap-2',
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8'
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline'
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly'
    },
    wrap: {
      true: 'flex-wrap',
      false: 'flex-nowrap'
    }
  },
  defaultVariants: {
    direction: 'row',
    gap: 'md',
    align: 'start',
    justify: 'start',
    wrap: false
  }
});

export interface FlexProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof flexVariants> {}

export function Flex({ className, direction, gap, align, justify, wrap, ...props }: FlexProps) {
  return (
    <div
      data-slot="flex"
      className={cn(flexVariants({ direction, gap, align, justify, wrap }), className)}
      {...props}
    />
  );
}

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function VStack({ className, gap = 'md', ...props }: StackProps) {
  return (
    <Flex direction="col" gap={gap} className={className} {...props} />
  );
}

export function HStack({ className, gap = 'md', ...props }: StackProps) {
  return (
    <Flex direction="row" gap={gap} align="center" className={className} {...props} />
  );
}

export type CenterProps = React.HTMLAttributes<HTMLDivElement>;

export function Center({ className, ...props }: CenterProps) {
  return (
    <div
      data-slot="center"
      className={cn('flex items-center justify-center w-full', className)}
      {...props}
    />
  );
}

export interface SpacerProps {
  size?: string;
  axis?: 'horizontal' | 'vertical';
}

export function Spacer({ size = '1rem', axis = 'vertical' }: SpacerProps) {
  const style = axis === 'vertical'
    ? { height: size, minHeight: size }
    : { width: size, minWidth: size };

  return <div data-slot="spacer" style={style} aria-hidden="true" />;
}
