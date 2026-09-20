import { cn } from '@/lib/utils';
import type { ProductStatus } from '@/types/catalogue.types';

interface StatusBadgeProps {
  status: ProductStatus;
  className?: string;
}

const STATUS_CONFIG: Record<ProductStatus, { label: string; className: string }> = {
  AVAILABLE: {
    label: 'TERSEDIA',
    className: 'text-(--cat-on-surface) text-[11px] font-semibold tracking-[0.06em]'
  },
  SOLD_OUT: {
    label: 'HABIS',
    className:
      'text-(--cat-on-surface-variant) text-[10px] font-semibold bg-(--cat-surface-container) px-1.5 py-0.5 border border-(--cat-stone)'
  },
  DISCONTINUED: {
    label: 'DISCONTINUED',
    className:
      'text-(--cat-on-surface-variant) bg-(--cat-surface-container-high) px-1.5 py-0.5 text-[10px] opacity-80'
  },
  COMING_SOON: {
    label: 'SEGERA HADIR',
    className: 'text-(--cat-accent-cobalt) text-[11px] font-semibold tracking-[0.06em]'
  },
  PRE_ORDER: {
    label: 'PRE-ORDER',
    className:
      'text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 border border-amber-500/30 text-[10px] font-bold tracking-[0.06em]'
  }
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] leading-4',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
