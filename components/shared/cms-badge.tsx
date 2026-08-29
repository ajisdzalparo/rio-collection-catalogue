import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type CMSBadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface CMSBadgeProps {
  variant: CMSBadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const VARIANT_STYLES: Record<CMSBadgeVariant, string> = {
  success: 'bg-emerald-600 hover:bg-emerald-600 text-white border-none',
  warning: 'bg-amber-500 hover:bg-amber-500 text-white border-none',
  error: 'bg-rose-500 hover:bg-rose-500 text-white border-none',
  info: 'bg-sky-600 hover:bg-sky-600 text-white border-none',
  neutral: 'bg-zinc-500 hover:bg-zinc-500 text-white border-none'
};

export function CMSBadge({ variant, children, className }: CMSBadgeProps) {
  return (
    <Badge
      className={cn(
        'font-semibold px-2.5 py-0.5 rounded-full text-[10px]',
        VARIANT_STYLES[variant],
        className
      )}
    >
      {children}
    </Badge>
  );
}
