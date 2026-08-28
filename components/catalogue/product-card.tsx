import Image from 'next/image';
import Link from 'next/link';
import { cn, formatPrice } from '@/lib/utils';
import { StatusBadge } from '@/components/catalogue/status-badge';
import type { Product } from '@/types/catalogue.types';

interface ProductCardProps {
  product: Product;
  className?: string;
  priority?: boolean;
}

export function ProductCard({ product, className, priority = false }: ProductCardProps) {
  const isSoldOut = product.status === 'SOLD_OUT';

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn('group block', className)}
      aria-label={`View ${product.name} — ${formatPrice(product.price)}`}
    >
      {/* Image Container — 4:5 ratio, 0px corners */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--cat-surface-container-low)]">
        <Image
          src={product.imageUrl}
          alt={`${product.name} — ${product.color}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={cn(
            'object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]',
            isSoldOut && 'opacity-70'
          )}
          priority={priority}
        />
        {/* SOLD OUT overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-[var(--cat-surface)]/80 backdrop-blur-[2px] px-4 py-2 font-[family-name:var(--font-hanken)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cat-on-surface-variant)]">
              Sold Out
            </span>
          </div>
        )}
        {/* Coming Soon overlay */}
        {product.status === 'COMING_SOON' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-[var(--cat-surface)]/80 backdrop-blur-[2px] px-4 py-2 font-[family-name:var(--font-hanken)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cat-accent-cobalt)]">
              Segera Hadir
            </span>
          </div>
        )}
      </div>

      {/* Metadata — below image */}
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-[family-name:var(--font-hanken)] text-[15px] font-medium leading-5 text-[var(--cat-on-surface)] truncate">
            {product.name}
          </h3>
          <p className="mt-0.5 font-[family-name:var(--font-hanken)] text-[12px] font-normal text-[var(--cat-on-surface-variant)] uppercase tracking-wide">
            {product.color}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-[family-name:var(--font-hanken)] text-[15px] font-medium text-[var(--cat-on-surface)] tabular-nums">
            {formatPrice(product.price)}
          </p>
          <div className="mt-0.5">
            <StatusBadge status={product.status} />
          </div>
        </div>
      </div>
    </Link>
  );
}
