'use client';

import { useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { SafeImage } from '@/components/shared';
import { cn, formatPrice } from '@/lib/utils';

const emptySubscribe = () => () => {};

export function CartDrawer() {
  const router = useRouter();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const { items, isOpen, closeCart, updateQuantity, removeItem, getTotalPrice, getTotalItems } =
    useCartStore();

  // Lock body scroll when cart drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted) return null;

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  const handleCheckout = () => {
    closeCart();
    router.push('/order?mode=cart');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className={cn(
          'fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      />

      {/* Drawer Panel */}
      <aside
        aria-label="Keranjang Belanja"
        className={cn(
          'fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-(--cat-surface) shadow-2xl flex flex-col transition-transform duration-300 ease-out border-l border-(--cat-stone)',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-(--cat-stone)">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-(--cat-on-surface)" />
            <h2 className="font-eb-garamond text-[20px] text-(--cat-on-surface) font-normal">
              Keranjang ({totalItems})
            </h2>
          </div>
          <button
            onClick={closeCart}
            aria-label="Tutup keranjang"
            className="p-1.5 text-(--cat-on-surface-variant) hover:text-(--cat-on-surface) transition-colors cursor-pointer"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Drawer Body: Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-(--cat-stone)/60">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag size={48} strokeWidth={1} className="text-(--cat-on-surface-variant)/50 mb-4" />
              <p className="font-eb-garamond text-[20px] text-(--cat-on-surface)">
                Keranjang Anda masih kosong
              </p>
              <p className="font-hanken text-[13px] text-(--cat-on-surface-variant) mt-1 max-w-xs">
                Pilih produk t-shirt favorit Anda dan tambahkan ke keranjang untuk memesan.
              </p>
              <button
                onClick={closeCart}
                className="mt-6 px-6 py-2.5 bg-(--cat-charcoal) text-white font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] hover:opacity-90 transition-opacity cursor-pointer"
              >
                Lanjut Belanja
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="py-4 flex gap-4">
                {/* Thumbnail */}
                <div className="relative w-20 h-24 shrink-0 bg-(--cat-surface-container-low) overflow-hidden border border-(--cat-stone)/50">
                  <SafeImage
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={closeCart}
                        className="font-eb-garamond text-[17px] text-(--cat-on-surface) hover:underline line-clamp-1"
                      >
                        {item.name}
                      </Link>
                      <button
                        onClick={() => removeItem(item.id)}
                        aria-label={`Hapus ${item.name}`}
                        className="text-(--cat-on-surface-variant)/60 hover:text-red-600 transition-colors p-1 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-1 font-hanken text-[12px] text-(--cat-on-surface-variant)">
                      <span>Size: <strong>{item.size}</strong></span>
                      <span>•</span>
                      <span className="capitalize">Color: <strong>{item.color}</strong></span>
                      {item.isPreOrder && (
                        <>
                          <span>•</span>
                          <span className="text-amber-600 font-medium">Pre-Order</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Price & Quantity Controls */}
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-hanken text-[14px] font-medium text-(--cat-on-surface) tabular-nums">
                      {formatPrice(item.price)}
                    </span>

                    <div className="inline-flex items-center border border-(--cat-stone)">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-(--cat-on-surface) hover:bg-(--cat-surface-container) transition-colors cursor-pointer"
                        aria-label="Kurangi kuantitas"
                      >
                        <Minus size={12} strokeWidth={1.5} />
                      </button>
                      <span className="w-8 h-7 flex items-center justify-center font-hanken text-[12px] font-medium border-x border-(--cat-stone) tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-(--cat-on-surface) hover:bg-(--cat-surface-container) transition-colors cursor-pointer"
                        aria-label="Tambah kuantitas"
                      >
                        <Plus size={12} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-(--cat-stone) bg-(--cat-surface-container-low)">
            <div className="flex items-center justify-between mb-4 font-hanken">
              <span className="text-[12px] uppercase tracking-[0.08em] text-(--cat-on-surface-variant)">
                Subtotal Produk
              </span>
              <span className="text-[18px] font-semibold text-(--cat-on-surface) tabular-nums">
                {formatPrice(totalPrice)}
              </span>
            </div>

            <p className="text-[11px] font-hanken text-(--cat-on-surface-variant) mb-4">
              Ongkos kirim akan dihitung otomatis saat pengisian alamat pengiriman.
            </p>

            <button
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-(--cat-charcoal) text-white font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] hover:opacity-90 transition-opacity cursor-pointer"
            >
              Lanjut ke Pembayaran <ArrowRight size={14} />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
