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
    label: 'Habis',
    className: 'text-(--cat-on-secondary-container) bg-(--cat-secondary-container) px-2 py-0.5'
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
