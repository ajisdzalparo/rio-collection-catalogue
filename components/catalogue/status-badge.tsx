import { cn } from '@/lib/utils';
import type { ProductStatus } from '@/types/catalogue.types';

interface StatusBadgeProps {
  status: ProductStatus;
  className?: string;
}

const STATUS_CONFIG: Record<ProductStatus, { label: string; className: string }> = {
  AVAILABLE: {
    label: 'Tersedia',
    className: 'text-(--cat-on-surface)'
  },
  SOLD_OUT: {
    label: 'Habis (Akan Restock)',
    className: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 border border-amber-500/20'
  },
  DISCONTINUED: {
    label: 'Discontinued',
    className: 'text-(--cat-on-surface-variant) bg-(--cat-surface-container-high) px-2 py-0.5 opacity-80'
  },
  COMING_SOON: {
    label: 'Segera Hadir',
    className: 'text-(--cat-accent-cobalt)'
  },
  PRE_ORDER: {
    label: 'Pre-Order',
    className: 'text-amber-600 dark:text-amber-500 bg-amber-500/10 px-2 py-0.5 border border-amber-500/20'
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
