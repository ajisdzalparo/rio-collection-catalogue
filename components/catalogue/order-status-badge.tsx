'use client';

import { cn } from '@/lib/utils';
import { getOrderStatusLabel } from '@/lib/order-status';

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

const STATUS_THEMES: Record<
  string,
  {
    container: string;
    dot?: string;
    pulse?: boolean;
  }
> = {
  PENDING: {
    container: 'bg-(--cat-surface-container) text-(--cat-on-surface) border-(--cat-stone)',
    dot: 'bg-amber-600',
    pulse: true
  },
  WAITING_PAYMENT: {
    container: 'bg-(--cat-surface-container) text-(--cat-on-surface) border-(--cat-stone)',
    dot: 'bg-amber-600',
    pulse: true
  },
  CONFIRMED: {
    container: 'bg-(--cat-surface-container) text-(--cat-accent-cobalt) border-(--cat-stone)',
    dot: 'bg-(--cat-accent-cobalt)'
  },
  PAID: {
    container: 'bg-(--cat-surface-container-high) text-(--cat-on-surface) border-(--cat-stone)',
    dot: 'bg-(--cat-charcoal)'
  },
  FULFILLED: {
    container: 'bg-(--cat-charcoal) text-white border-(--cat-charcoal)',
    dot: 'bg-emerald-400'
  },
  CANCELLED: {
    container: 'bg-(--cat-surface-container-high) text-(--cat-on-surface-variant) border-(--cat-stone) opacity-75',
    dot: 'bg-(--cat-outline)'
  },
  REJECTED: {
    container: 'bg-(--cat-error-container) text-(--cat-on-error-container) border-(--cat-error)/20',
    dot: 'bg-(--cat-error)'
  },
  EXPIRED: {
    container: 'bg-(--cat-error-container) text-(--cat-on-error-container) border-(--cat-error)/20',
    dot: 'bg-(--cat-error)'
  }
};

const DEFAULT_THEME = {
  container: 'bg-(--cat-surface-container) text-(--cat-on-surface) border-(--cat-stone)',
  dot: 'bg-(--cat-charcoal)'
};

const SIZE_CONFIG = {
  sm: {
    container: 'px-2.5 py-0.5 text-[10px] gap-1.5',
    dot: 'w-1.5 h-1.5'
  },
  md: {
    container: 'px-3 py-1 text-[11px] gap-2',
    dot: 'w-1.5 h-1.5'
  },
  lg: {
    container: 'px-4 py-1.5 text-[12px] gap-2',
    dot: 'w-2 h-2'
  }
};

export function OrderStatusBadge({
  status,
  className,
  size = 'md',
  showDot = true
}: OrderStatusBadgeProps) {
  const label = getOrderStatusLabel(status);
  const theme = STATUS_THEMES[status] || DEFAULT_THEME;
  const sizeStyles = SIZE_CONFIG[size];

  return (
    <span
      className={cn(
        'inline-flex items-center font-hanken font-semibold uppercase tracking-[0.08em] border border-solid transition-colors',
        sizeStyles.container,
        theme.container,
        className
      )}
    >
      {showDot && theme.dot && (
        <span
          className={cn(
            'rounded-full shrink-0',
            sizeStyles.dot,
            theme.dot,
            theme.pulse && 'animate-pulse'
          )}
        />
      )}
      <span>{label}</span>
    </span>
  );
}
