import React from 'react';
import { cn } from '@/lib/utils';

export interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const normalized = (status || '').toUpperCase();

  const getStyle = () => {
    switch (normalized) {
      case 'PENDING':
        return 'bg-amber-500 text-white';
      case 'CONFIRMED':
        return 'bg-blue-600 text-white';
      case 'WAITING_PAYMENT':
        return 'bg-purple-600 text-white';
      case 'PAID':
        return 'bg-emerald-600 text-white';
      case 'FULFILLED':
        return 'bg-[#2f6f52] text-white';
      case 'CANCELLED':
      case 'REJECTED':
      case 'EXPIRED':
        return 'bg-[#c1272d] text-white';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  const formattedText = normalized.replace(/_/g, ' ');

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border-transparent shadow-xs transition-colors select-none',
        getStyle(),
        className
      )}
    >
      {formattedText}
    </span>
  );
}
