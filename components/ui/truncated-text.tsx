'use client';

import React from 'react';
import { QuickTooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface TruncatedTextProps {
  text: string;
  className?: string;
  maxWidth?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function TruncatedText({
  text,
  className,
  maxWidth = 'max-w-[240px]',
  side = 'top'
}: TruncatedTextProps) {
  if (!text) return null;

  return (
    <QuickTooltip content={text} side={side} delay={150}>
      <span className={cn('block truncate cursor-pointer max-w-full min-w-0', maxWidth, className)}>
        {text}
      </span>
    </QuickTooltip>
  );
}
