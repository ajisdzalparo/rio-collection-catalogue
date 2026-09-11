'use client';

import { useSyncExternalStore } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { cn } from '@/lib/utils';

interface CartButtonProps {
  className?: string;
}

const emptySubscribe = () => () => {};

export function CartButton({ className }: CartButtonProps) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const { openCart, getTotalItems } = useCartStore();
  const totalItems = getTotalItems();

  return (
    <button
      onClick={openCart}
      aria-label={`Keranjang belanja (${mounted ? totalItems : 0} item)`}
      className={cn(
        'relative p-1.5 text-(--cat-on-surface) hover:opacity-70 transition-opacity cursor-pointer flex items-center justify-center',
        className
      )}
    >
      <ShoppingBag size={18} strokeWidth={1.5} />
      {mounted && totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-(--cat-charcoal) text-white text-[10px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center scale-95 animate-in fade-in zoom-in-75">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  );
}
