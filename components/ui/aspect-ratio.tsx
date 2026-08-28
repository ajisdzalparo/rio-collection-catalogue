'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const ratioMap = {
  'square': '1/1',
  'video': '16/9',
  'photo': '4/3',
  'portrait': '3/4',
  'cinema': '21/9',
  'tall': '9/16',
} as const;

export type AspectRatioPreset = keyof typeof ratioMap;

export interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  ratio?: AspectRatioPreset | `${number}/${number}`;
}

export function AspectRatio({
  ratio = 'video',
  className,
  children,
  style,
  ...props
}: AspectRatioProps) {
  const resolvedRatio = (ratio in ratioMap)
    ? ratioMap[ratio as AspectRatioPreset]
    : ratio;

  return (
    <div
      data-slot="aspect-ratio"
      className={cn('relative w-full overflow-hidden', className)}
      style={{ aspectRatio: resolvedRatio, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}
