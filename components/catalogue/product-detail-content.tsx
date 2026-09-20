'use client';

import { useState, useMemo } from 'react';
import { useProductReviews } from '@/hooks/use-product-reviews';
import { SafeImage } from '@/components/shared';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Minus, Plus, ShoppingBag } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { StatusBadge } from '@/components/catalogue/status-badge';
import { SizeGuideModal } from '@/components/catalogue/size-guide-modal';
import { StarRating } from '@/components/catalogue/star-rating';
import { ProductReviews } from '@/components/catalogue/product-reviews';
import { CountdownTimer } from '@/components/catalogue/countdown-timer';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/cart-store';
import type { Product, ProductStatus } from '@/types/catalogue.types';
import { isComingSoonActive } from '@/lib/product-availability';
import { toast } from 'sonner';

interface ProductDetailContentProps {
  product: Product;
}

export function ProductDetailContent({ product }: ProductDetailContentProps) {
  const router = useRouter();
  const initialComingSoon = isComingSoonActive(product.status, product.releaseDate);
  const [isComingSoon, setIsComingSoon] = useState(initialComingSoon);

  const effectiveStatus: ProductStatus =
    product.status === 'COMING_SOON' && !isComingSoon
      ? 'AVAILABLE'
      : product.status;

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const { addItem, items } = useCartStore();
  const { averageRating, totalReviews } = useProductReviews(product.slug);

  const ratingData = useMemo(() => ({
    averageRating,
    totalReviews
  }), [averageRating, totalReviews]);

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
    const rawDetails = Array.isArray(product.imageDetails) ? product.imageDetails : [];
    const detailUrls = rawDetails.map((img) => img?.url).filter(Boolean) as string[];

    const fallbackDetails = (Array.isArray(product.images) ? product.images : []).filter(
      (img) => Boolean(img) && img !== product.imageUrl
    );

    const allDetails = detailUrls.length > 0 ? detailUrls : fallbackDetails;

    return Array.from(new Set([product.imageUrl, ...allDetails].filter(Boolean) as string[]));
  }, [product.imageDetails, product.images, product.imageUrl]);

  const activeImage = imagesList[activeImageIndex] || product.imageUrl;

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? imagesList.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1));
  };

  const selectedColorName = colorsList[selectedColorIndex] || product.color;
  const isUnlimitedStock =
    product.stockMode === 'ALWAYS_AVAILABLE' || effectiveStatus === 'PRE_ORDER';
  const isQuantityBased = !isUnlimitedStock;
  const productVariants = Array.isArray(product.variants) ? product.variants : [];
  const selectedVariant = productVariants.find((variant) => variant.size === selectedSize);
  const selectedStock =
    selectedVariant?.stock === undefined ? undefined : Math.max(0, selectedVariant.stock);
  const availableStock = isUnlimitedStock
    ? 9999
    : selectedVariant?.inStock
      ? (selectedStock ?? 0)
      : 0;
  const quantityLimit =
    product.orderLimitMode === 'ONCE_PER_USER' ? 1 : isQuantityBased ? availableStock : undefined;
  const isAtQuantityLimit = quantityLimit !== undefined && quantity >= quantityLimit;
  const canOrder =
    (effectiveStatus === 'AVAILABLE' || effectiveStatus === 'PRE_ORDER') &&
    (selectedVariant ? isUnlimitedStock || selectedVariant.inStock === true : false) &&
    (!isQuantityBased || availableStock >= quantity);
  const totalStock = isQuantityBased
    ? Math.max(
        0,
        productVariants.reduce((total, variant) => total + Math.max(0, variant.stock ?? 0), 0)
      )
    : undefined;

  const handleSelectSize = (size: string, stock?: number) => {
    setSelectedSize(size);
    setQuantity((currentQuantity) =>
      stock === undefined ? currentQuantity : Math.max(1, Math.min(currentQuantity, stock))
    );
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error('Silakan pilih ukuran terlebih dahulu.');
      return;
    }

    if (!canOrder) {
      toast.error('Jumlah yang dipilih melebihi stok yang tersedia.');
      return;
    }

    const cartItemId = `${product.id}-${selectedSize}-${selectedColorName}`;
    const quantityInCart = items.find((item) => item.id === cartItemId)?.quantity ?? 0;

    if (quantityLimit !== undefined && quantityInCart + quantity > quantityLimit) {
      const remainingQuantity = Math.max(0, quantityLimit - quantityInCart);
      toast.error(
        remainingQuantity > 0
          ? `Hanya tersisa ${remainingQuantity} pcs lagi untuk ukuran ${selectedSize}.`
          : `Batas pembelian ukuran ${selectedSize} sudah tercapai di keranjang.`
      );
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      imageUrl: product.imageUrl,
      size: selectedSize,
      color: selectedColorName,
      quantity,
      isPreOrder: product.status === 'PRE_ORDER',
      availableStock: isQuantityBased ? availableStock : undefined,
      maxQuantity: quantityLimit
    });

    toast.success(`${product.name} (${selectedSize}) ditambahkan ke keranjang.`);
  };

  return (
    <>
      {/* Main Product Section */}
      <section className="mx-auto max-w-350 px-4 md:px-16 py-8 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">
          {/* Left Gallery: Multi-image thumbnails + Main display (7 columns on desktop) */}
          <div className="md:col-span-7 flex flex-col-reverse md:flex-row gap-4 items-start md:sticky md:top-24">
            {/* Thumbnails list */}
            {imagesList.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto shrink-0 scrollbar-none py-1 md:py-0 max-h-[80vh]">
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
            <div className="relative flex-1 w-full aspect-3/4 max-h-[82vh] overflow-hidden bg-(--cat-surface-container-low) group">
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

            {/* Rating summary under title */}
            <div className="mt-2 flex items-center gap-2">
              <StarRating
                rating={ratingData.averageRating}
                size={15}
                showValue
                totalReviews={ratingData.totalReviews}
              />
            </div>

            <p className="mt-3 font-hanken text-[20px] font-medium text-(--cat-on-surface) tabular-nums">
              {formatPrice(product.price)}
            </p>

            {/* Description */}
            <p className="mt-4 font-hanken text-[15px] leading-relaxed text-(--cat-on-surface-variant) max-w-md">
              {product.description}
            </p>

            {/* Status & Limit Badge */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-(--cat-charcoal)" />
                <StatusBadge status={effectiveStatus} className="text-[12px]" />
              </div>
              {product.orderLimitMode === 'ONCE_PER_USER' && (
                <span className="px-2.5 py-0.5 bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[11px] font-hanken font-medium">
                  Maks. 1x per Pelanggan
                </span>
              )}
              {isQuantityBased && (
                <span className="font-hanken text-[11px] text-(--cat-on-surface-variant) tabular-nums">
                  Stok total: {totalStock} pcs
                </span>
              )}
            </div>

            {/* Coming Soon Countdown Box */}
            {isComingSoon && product.releaseDate && (
              <div className="mt-6">
                <CountdownTimer
                  targetDate={product.releaseDate}
                  variant="detail"
                  onEnded={() => {
                    setIsComingSoon(false);
                    router.refresh();
                    toast.success('Rilisan telah dibuka! Produk kini dapat dipesan.');
                  }}
                />
              </div>
            )}

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
                        isLightColor
                          ? 'border-stone-400 dark:border-stone-500'
                          : 'border-stone-300 dark:border-stone-700',
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
                {productVariants.map((variant) => {
                  const variantStock = Math.max(0, variant.stock ?? 0);
                  const isVariantAvailable = isUnlimitedStock
                    ? variant.inStock !== false
                    : variant.inStock && variantStock > 0;

                  return (
                    <button
                      key={variant.size}
                      disabled={!isVariantAvailable}
                      onClick={() =>
                        handleSelectSize(variant.size, isQuantityBased ? variant.stock : undefined)
                      }
                      className={cn(
                        'min-h-12 py-1.5 flex flex-col items-center justify-center font-hanken border transition-all duration-150 cursor-pointer',
                        selectedSize === variant.size
                          ? 'bg-(--cat-charcoal) text-white border-(--cat-charcoal)'
                          : isVariantAvailable
                            ? 'border-(--cat-stone) text-(--cat-on-surface) hover:border-(--cat-charcoal)'
                            : 'border-(--cat-stone)/50 text-(--cat-on-surface-variant)/40 cursor-not-allowed'
                      )}
                    >
                      <span
                        className={cn(
                          'text-[13px] font-medium',
                          !isVariantAvailable && 'line-through'
                        )}
                      >
                        {variant.size}
                      </span>
                      {isQuantityBased && variant.stock !== undefined && (
                        <span className="mt-0.5 text-[10px] font-normal tabular-nums opacity-75">
                          {variantStock} pcs
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {isQuantityBased && selectedSize && selectedStock !== undefined && (
                <p className="mt-2 font-hanken text-[11px] text-(--cat-on-surface-variant) tabular-nums">
                  Stok ukuran {selectedSize}: <strong>{selectedStock} pcs</strong>
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface)">
                  Quantity
                </p>
              </div>
              <div className="inline-flex items-center border border-(--cat-stone)">
                <button
                  disabled={product.orderLimitMode === 'ONCE_PER_USER' || quantity <= 1}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center text-(--cat-on-surface) transition-colors',
                    product.orderLimitMode === 'ONCE_PER_USER' || quantity <= 1
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-(--cat-surface-container) cursor-pointer'
                  )}
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} strokeWidth={1.5} />
                </button>
                <span className="w-12 h-10 flex items-center justify-center font-hanken text-[14px] font-medium border-x border-(--cat-stone) tabular-nums">
                  {product.orderLimitMode === 'ONCE_PER_USER' ? 1 : quantity}
                </span>
                <button
                  disabled={
                    product.orderLimitMode === 'ONCE_PER_USER' ||
                    selectedSize === null ||
                    isAtQuantityLimit
                  }
                  onClick={() =>
                    setQuantity((currentQuantity) =>
                      quantityLimit === undefined
                        ? currentQuantity + 1
                        : Math.min(currentQuantity + 1, quantityLimit)
                    )
                  }
                  className={cn(
                    'w-10 h-10 flex items-center justify-center text-(--cat-on-surface) transition-colors',
                    product.orderLimitMode === 'ONCE_PER_USER' ||
                      selectedSize === null ||
                      isAtQuantityLimit
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-(--cat-surface-container) cursor-pointer'
                  )}
                  aria-label="Increase quantity"
                >
                  <Plus size={14} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Dual CTA Buttons: Add to Cart & Buy Now */}
            <div className="mt-8 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Add to Cart */}
                <button
                  type="button"
                  disabled={!canOrder}
                  onClick={handleAddToCart}
                  className={cn(
                    'w-full inline-flex items-center justify-center gap-2 py-3.5 border border-(--cat-charcoal) font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors',
                    canOrder
                      ? 'bg-transparent text-(--cat-on-surface) hover:bg-(--cat-surface-container) cursor-pointer'
                      : 'border-(--cat-stone) text-(--cat-on-surface-variant)/50 cursor-not-allowed'
                  )}
                >
                  <ShoppingBag size={14} strokeWidth={1.5} />+ Keranjang
                </button>

                {/* Buy / Pre-order Now */}
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
                    'w-full inline-flex items-center justify-center gap-2 py-3.5 font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] transition-opacity duration-150',
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
                        ? selectedSize === null
                          ? 'Pilih Ukuran'
                          : 'Pre-Order Now'
                        : selectedSize === null
                          ? 'Pilih Ukuran'
                          : 'Beli Sekarang'}
                  {canOrder && <ArrowRight size={14} strokeWidth={2} />}
                </Link>
              </div>

              {(product.status === 'AVAILABLE' || product.status === 'PRE_ORDER') && (
                <p className="font-hanken text-[12px] text-(--cat-on-surface-variant) text-center sm:text-left">
                  Pengiriman ke seluruh Indonesia dengan opsi ekspedisi lengkap.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Related blog articles — hidden when the product has no journal relation */}
      {product.journals && product.journals.length > 0 && (
        <section className="mx-auto max-w-350 px-4 md:px-16 py-8 md:py-16">
          <h2 className="font-eb-garamond text-[28px] md:text-[36px] font-normal leading-tight text-(--cat-on-surface)">
            Blog Terkait
          </h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {product.journals.map((journal) => (
              <Link key={journal.id} href={`/journal/${journal.slug}`} className="group block">
                <div className="relative aspect-4/3 overflow-hidden bg-(--cat-surface-container-low)">
                  <SafeImage
                    src={journal.imageUrl}
                    alt={journal.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                </div>
                <p className="mt-3 font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant)">
                  {journal.category} · {journal.date}
                </p>
                <h3 className="mt-1 font-eb-garamond text-[22px] md:text-[26px] leading-tight text-(--cat-on-surface) group-hover:underline underline-offset-4">
                  {journal.title}
                </h3>
                <p className="mt-2 font-hanken text-[14px] leading-relaxed text-(--cat-on-surface-variant) line-clamp-2">
                  {journal.excerpt}
                </p>
              </Link>
            ))}
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
                [
                  'Care Instruction',
                  product.materialsAndCare?.careInstruction ||
                    'Machine wash cold, tumble dry low, do not bleach'
                ]
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

      {/* Customer Reviews Section */}
      <div className="mx-auto max-w-350 px-4 md:px-16 pb-12">
        <ProductReviews productSlug={product.slug} productName={product.name} />
      </div>

      <SizeGuideModal isOpen={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </>
  );
}
