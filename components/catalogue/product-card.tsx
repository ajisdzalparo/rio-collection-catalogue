'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn, formatPrice } from '@/lib/utils';
import { CountdownTimer } from '@/components/catalogue/countdown-timer';
import type { Product, ProductStatus } from '@/types/catalogue.types';
import { SafeImage } from '@/components/shared';
import { isComingSoonActive } from '@/lib/product-availability';

interface ProductCardProps {
  product: Product;
  className?: string;
  priority?: boolean;
}

export function ProductCard({ product, className, priority = false }: ProductCardProps) {
  const router = useRouter();
  const initialComingSoon = isComingSoonActive(product.status, product.releaseDate);
  const [isComingSoon, setIsComingSoon] = useState(initialComingSoon);

  const effectiveStatus: ProductStatus =
    product.status === 'COMING_SOON' && !isComingSoon ? 'AVAILABLE' : product.status;

  const isSoldOut = effectiveStatus === 'SOLD_OUT';
  const isDiscontinued = effectiveStatus === 'DISCONTINUED';
  const isUnavailable = isSoldOut || isDiscontinued;

  const colorList = product.colors?.length ? product.colors : product.color ? [product.color] : [];

  const handleCountdownEnded = () => {
    setIsComingSoon(false);
    router.refresh();
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        'group border border-(--cat-stone) rounded-lg bg-(--cat-surface) overflow-hidden hover:border-(--cat-charcoal)/60 hover:shadow-xs transition-all duration-200 flex flex-col justify-between h-full',
        className
      )}
      aria-label={`View ${product.name} — ${formatPrice(product.price)}`}
    >
      {/* Full Bleed Image Container — 0 padding, full width */}
      <div className="relative aspect-4/5 w-full overflow-hidden bg-(--cat-surface-container-low)">
        <SafeImage
          src={product.imageUrl}
          alt={`${product.name} — ${product.color}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={cn(
            'object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]',
            isUnavailable && 'opacity-65'
          )}
          priority={priority}
        />

        {/* Top-Left Status Badge (e.g. STOK HABIS / PRE-ORDER / SEGERA HADIR) */}
        {isSoldOut && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="bg-black text-white px-2 py-0.5 font-hanken text-[9px] font-bold uppercase tracking-wider shadow-xs">
              Stok Habis
            </span>
          </div>
        )}

        {isDiscontinued && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="bg-stone-700 text-white px-2 py-0.5 font-hanken text-[9px] font-bold uppercase tracking-wider shadow-xs">
              Discontinued
            </span>
          </div>
        )}

        {effectiveStatus === 'PRE_ORDER' && !isSoldOut && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="bg-amber-600 text-white px-2 py-0.5 font-hanken text-[9px] font-bold uppercase tracking-wider shadow-xs">
              Pre-Order
            </span>
          </div>
        )}

        {/* Coming Soon overlay with countdown */}
        {isComingSoon && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-black/20 backdrop-blur-[1px]">
            <span className="bg-(--cat-surface) px-3 py-1 font-hanken text-[10px] font-bold uppercase tracking-wider text-(--cat-on-surface) shadow-xs">
              Segera Hadir
            </span>
            {product.releaseDate && (
              <div className="mt-2">
                <CountdownTimer
                  targetDate={product.releaseDate}
                  variant="compact"
                  onEnded={handleCountdownEnded}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metadata — Centered with comfortable padding */}
      <div className="p-3.5 sm:p-4 flex flex-col items-center text-center flex-1 justify-between">
        <div className="space-y-1">
          <h3 className="font-hanken text-[13px] sm:text-[14px] font-medium text-(--cat-on-surface) line-clamp-2 leading-snug group-hover:text-black dark:group-hover:text-white transition-colors">
            {product.name}
          </h3>

          {colorList.length > 0 && (
            <p className="font-hanken text-[11px] sm:text-[12px] font-normal text-(--cat-on-surface-variant) uppercase tracking-wide">
              {colorList.join(' / ')}
            </p>
          )}
        </div>

        <div className="mt-2 pt-1">
          <p className="font-hanken text-[13px] sm:text-[14px] font-semibold text-(--cat-on-surface) tabular-nums">
            {formatPrice(product.price)}
          </p>
        </div>
      </div>
    </Link>
  );
}
