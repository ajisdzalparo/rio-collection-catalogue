'use client';

import { useState, useMemo } from 'react';
import { SafeImage } from '@/components/shared';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { StatusBadge } from '@/components/catalogue/status-badge';
import { SizeGuideModal } from '@/components/catalogue/size-guide-modal';
import type { Product } from '@/types/catalogue.types';

interface ProductDetailContentProps {
  product: Product;
}

export function ProductDetailContent({ product }: ProductDetailContentProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const colorsList = useMemo(
    () => (product.colors?.length ? product.colors : [product.color].filter(Boolean)),
    [product.colors, product.color]
  );

  const hexesList = useMemo(
    () => (product.colorHexes?.length ? product.colorHexes : [product.colorHex].filter(Boolean)),
    [product.colorHexes, product.colorHex]
  );

  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  // Read all images entered in the CMS (cover image + all uploaded detail images)
  const imagesList = useMemo(() => {
    const detailUrls = (product.imageDetails ?? [])
      .map((img) => img.url)
      .filter(Boolean);

    const fallbackDetails = (product.images ?? [])
      .filter((img) => img && img !== product.imageUrl);

    const allDetails = detailUrls.length > 0 ? detailUrls : fallbackDetails;

    return Array.from(new Set([product.imageUrl, ...allDetails].filter(Boolean)));
  }, [product.imageDetails, product.images, product.imageUrl]);

  const activeImage = imagesList[activeImageIndex] || product.imageUrl;

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? imagesList.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1));
  };

  const canOrder =
    (product.status === 'AVAILABLE' || product.status === 'PRE_ORDER') && selectedSize !== null;
  const selectedColorName = colorsList[selectedColorIndex] || product.color;

  return (
    <>
      {/* Main Product Section */}
      <section className="mx-auto max-w-350 px-4 md:px-16 py-8 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {/* Left Gallery: Multi-image thumbnails + Main display (7 columns on desktop) */}
          <div className="md:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnails list */}
            {imagesList.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto shrink-0 scrollbar-none py-1 md:py-0">
                {imagesList.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    onClick={() => setActiveImageIndex(idx)}
                    className={cn(
                      'relative w-16 h-20 md:w-20 md:h-24 shrink-0 overflow-hidden bg-(--cat-surface-container-low) border transition-all duration-150 cursor-pointer',
                      activeImageIndex === idx
                        ? 'border-(--cat-charcoal) ring-1 ring-(--cat-charcoal) opacity-100'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    )}
                    aria-label={`View product image ${idx + 1}`}
                  >
                    <SafeImage
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Active Image View */}
            <div className="relative flex-1 aspect-4/5 overflow-hidden bg-(--cat-surface-container-low) group">
              <SafeImage
                src={activeImage}
                alt={`${product.name} — ${product.color} (View ${activeImageIndex + 1})`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 ease-out"
                priority
              />

              {/* Prev / Next Controls overlay */}
              {imagesList.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-(--cat-surface)/80 hover:bg-(--cat-surface) text-(--cat-on-surface) transition-opacity duration-150 backdrop-blur-xs opacity-80 md:opacity-0 group-hover:opacity-100 cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={18} strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-(--cat-surface)/80 hover:bg-(--cat-surface) text-(--cat-on-surface) transition-opacity duration-150 backdrop-blur-xs opacity-80 md:opacity-0 group-hover:opacity-100 cursor-pointer"
                    aria-label="Next image"
                  >
                    <ChevronRight size={18} strokeWidth={1.5} />
                  </button>

                  {/* Image Counter indicator */}
                  <div className="absolute bottom-3 right-3 bg-(--cat-surface)/80 backdrop-blur-xs px-2.5 py-1 text-[11px] font-hanken font-medium text-(--cat-on-surface)">
                    {activeImageIndex + 1} / {imagesList.length}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Info: Product Details (5 columns on desktop) */}
          <div className="md:col-span-5 flex flex-col justify-start py-0 md:py-2">
            {/* Breadcrumbs */}
            <nav
              className="mb-4 font-hanken text-[11px] uppercase tracking-[0.08em] text-(--cat-on-surface-variant)"
              aria-label="Breadcrumb"
            >
              <Link href="/" className="hover:text-(--cat-on-surface) transition-colors">
                Home
              </Link>
              <span className="mx-2">/</span>
              <Link href="/catalogue" className="hover:text-(--cat-on-surface) transition-colors">
                Catalogue
              </Link>
              <span className="mx-2">/</span>
              <span className="text-(--cat-on-surface) font-semibold">{product.name}</span>
            </nav>

            {/* Title & Price */}
            <h1 className="font-eb-garamond text-[32px] md:text-[42px] font-normal leading-tight text-(--cat-on-surface)">
              {product.name}
            </h1>
            <p className="mt-2 font-hanken text-[20px] font-medium text-(--cat-on-surface) tabular-nums">
              {formatPrice(product.price)}
            </p>

            {/* Description */}
            <p className="mt-4 font-hanken text-[15px] leading-relaxed text-(--cat-on-surface-variant) max-w-md">
              {product.description}
            </p>

            {/* Status */}
            <div className="mt-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-(--cat-charcoal)" />
              <StatusBadge status={product.status} className="text-[12px]" />
            </div>

            {/* Color Selector */}
            <div className="mt-6">
              <p className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-2">
                Color / Warna:{' '}
                <span className="font-normal text-(--cat-on-surface-variant) capitalize ml-1">
                  {colorsList[selectedColorIndex] || product.color}
                </span>
              </p>
              <div className="flex items-center gap-2.5">
                {hexesList.map((hex, idx) => {
                  const isSelected = selectedColorIndex === idx;
                  const colorName = colorsList[idx] || product.color;
                  const isLightColor =
                    hex.toLowerCase() === '#ffffff' ||
                    hex.toLowerCase() === '#fff' ||
                    hex.toLowerCase() === '#fafafa' ||
                    hex.toLowerCase() === '#f5f5f5' ||
                    hex.toLowerCase() === '#f0f0f0' ||
                    hex.toLowerCase() === '#ffffff00';

                  return (
                    <button
                      key={`${hex}-${idx}`}
                      type="button"
                      onClick={() => setSelectedColorIndex(idx)}
                      className={cn(
                        'w-7 h-7 rounded-none transition-all cursor-pointer relative flex items-center justify-center border',
                        isLightColor ? 'border-stone-400 dark:border-stone-500' : 'border-stone-300 dark:border-stone-700',
                        isSelected
                          ? 'ring-2 ring-foreground border-foreground scale-105 opacity-100 shadow-xs'
                          : 'opacity-80 hover:opacity-100'
                      )}
                      style={{ backgroundColor: hex }}
                      title={colorName}
                      aria-label={`Pilih warna ${colorName}`}
                    >
                      {isSelected && (
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full',
                            isLightColor ? 'bg-black' : 'bg-white shadow-xs'
                          )}
                        />
                      )}
                    </button>
                  );
                })}
                <span className="ml-1 font-hanken text-[13px] text-(--cat-on-surface-variant)">
                  {colorsList.join(' / ')}
                </span>
              </div>
            </div>

            {/* Size Selector */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface)">
                  Size / Ukuran
                </p>
                <button
                  onClick={() => setSizeGuideOpen(true)}
                  className="font-hanken text-[12px] text-(--cat-on-surface-variant) underline hover:text-(--cat-on-surface) cursor-pointer"
                >
                  Size Guide
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.size}
                    disabled={!variant.inStock}
                    onClick={() => setSelectedSize(variant.size)}
                    className={cn(
                      'h-11 flex items-center justify-center font-hanken text-[13px] font-medium border transition-all duration-150 cursor-pointer',
                      selectedSize === variant.size
                        ? 'bg-(--cat-charcoal) text-white border-(--cat-charcoal)'
                        : variant.inStock
                          ? 'border-(--cat-stone) text-(--cat-on-surface) hover:border-(--cat-charcoal)'
                          : 'border-(--cat-stone)/50 text-(--cat-on-surface-variant)/40 cursor-not-allowed line-through'
                    )}
                  >
                    {variant.size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mt-6">
              <p className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-2">
                Quantity
              </p>
              <div className="inline-flex items-center border border-(--cat-stone)">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center text-(--cat-on-surface) hover:bg-(--cat-surface-container) transition-colors cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} strokeWidth={1.5} />
                </button>
                <span className="w-12 h-10 flex items-center justify-center font-hanken text-[14px] font-medium border-x border-(--cat-stone) tabular-nums">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center text-(--cat-on-surface) hover:bg-(--cat-surface-container) transition-colors cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-8">
              <Link
                href={
                  canOrder
                    ? `/order?product=${product.slug}&size=${encodeURIComponent(selectedSize || 'M')}&color=${encodeURIComponent(selectedColorName)}&quantity=${quantity}`
                    : '#'
                }
                onClick={(e) => {
                  if (!canOrder) e.preventDefault();
                }}
                className={cn(
                  'w-full inline-flex items-center justify-center gap-2 px-12 py-3.5 font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] transition-opacity duration-150',
                  canOrder
                    ? 'bg-(--cat-charcoal) text-white hover:opacity-85 cursor-pointer'
                    : 'bg-(--cat-secondary-container) text-(--cat-on-secondary-container) cursor-not-allowed'
                )}
              >
                {product.status === 'SOLD_OUT'
                  ? 'Habis'
                  : product.status === 'COMING_SOON'
                    ? 'Segera Hadir'
                    : product.status === 'PRE_ORDER'
                      ? (selectedSize === null ? 'Pilih Ukuran' : 'Pre-Order Now')
                      : selectedSize === null
                        ? 'Pilih Ukuran'
                        : 'Request to Order'}
                {canOrder && <ArrowRight size={14} strokeWidth={2} />}
              </Link>
              {(product.status === 'AVAILABLE' || product.status === 'PRE_ORDER') && (
                <p className="mt-2 font-hanken text-[12px] text-(--cat-on-surface-variant)">
                  Submit your order request. We&apos;ll confirm availability and contact you via
                  WhatsApp for payment.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Product Story Section — CMS-driven, hidden when empty */}
      {product.storyTitle && (
        <section className="mx-auto max-w-350 px-4 md:px-16 py-8 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div>
              <h2 className="font-eb-garamond text-[28px] md:text-[36px] font-normal leading-tight text-(--cat-on-surface)">
                {product.storyTitle}
              </h2>
              {product.storyText && (
                <p className="mt-4 font-hanken text-[15px] leading-relaxed text-(--cat-on-surface-variant)">
                  {product.storyText}
                </p>
              )}
            </div>
            <div className="relative aspect-4/3 overflow-hidden bg-(--cat-surface-container-low)">
              <SafeImage
                src={imagesList[1] || product.imageUrl}
                alt={`${product.name} detail view`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute top-3 left-3">
                <span className="font-hanken text-[10px] uppercase tracking-widest text-(--cat-on-surface-variant) bg-(--cat-surface)/80 px-2 py-1">
                  Detail
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Materials & Care */}
      <section className="mx-auto max-w-350 px-4 md:px-16 py-8 md:py-16 border-t border-(--cat-stone)">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-3">
            <h3 className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface)">
              Materials & Care
            </h3>
          </div>
          <div className="md:col-span-9">
            <div className="space-y-0 divide-y divide-(--cat-stone)">
              {[
                ['Fabric', product.materialsAndCare?.fabric || '100% Premium Heavyweight Cotton'],
                ['Treatment', product.materialsAndCare?.treatment || 'Pre-washed & Bio-polished'],
                ['Origin', product.materialsAndCare?.origin || 'Handcrafted in Indonesia'],
                ['Care Instruction', product.materialsAndCare?.careInstruction || 'Machine wash cold, tumble dry low, do not bleach']
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between py-4 gap-8">
                  <span className="font-hanken text-[14px] text-(--cat-on-surface-variant) shrink-0">
                    {label}
                  </span>
                  <span className="font-hanken text-[14px] font-medium text-(--cat-on-surface) text-right">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SizeGuideModal isOpen={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </>
  );
}
