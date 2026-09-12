import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CountdownTimer } from '@/components/catalogue/countdown-timer';
import type { StoreSettings } from '@/hooks/use-store-settings';
import type { Product } from '@/types/catalogue.types';

interface HeroSectionProps {
  settings?: Partial<StoreSettings> | null;
  comingSoonProduct?: Product | null;
  className?: string;
}

export function HeroSection({ settings, comingSoonProduct, className }: HeroSectionProps) {
  const heroTitle = settings?.heroTitle;
  const heroSubtitle = settings?.heroSubtitle;
  const heroLayout = settings?.heroLayout || '2-grid';
  const heroLeftImage = settings?.heroLeftImage;
  const heroCenterImage = settings?.heroCenterImage;
  const heroRightImage = settings?.heroRightImage;
  const heroCtaText = settings?.heroCtaText;
  const heroCtaLink = settings?.heroCtaLink;

  return (
    <section
      className={cn('relative w-full overflow-hidden', className)}
      aria-label="Hero Section"
    >
      <div className="relative w-full h-[70vh] md:h-[85vh] bg-(--cat-surface-container-low)">
        {/* Dynamic Image Grid Layout */}
        {heroLayout === 'single' ? (
          /* ═══ Single Full Banner (1 Kolom) ═══ */
          <div className="absolute inset-0">
            {heroLeftImage && (
              <Image
                src={heroLeftImage}
                alt={heroTitle || "Editorial campaign"}
                fill
                sizes="100vw"
                className="object-cover object-center"
                priority
              />
            )}
          </div>
        ) : heroLayout === '3-grid' ? (
          /* ═══ 3-Column Trio Grid ═══ */
          <div className="absolute inset-0 grid grid-cols-1 sm:grid-cols-3">
            <div className="relative h-full w-full">
              {heroLeftImage && (
                <Image
                  src={heroLeftImage}
                  alt={heroTitle || "Editorial campaign left"}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover object-top"
                  priority
                />
              )}
            </div>
            <div className="relative hidden sm:block h-full w-full">
              {heroCenterImage && (
                <Image
                  src={heroCenterImage}
                  alt={heroTitle || "Editorial campaign center"}
                  fill
                  sizes="33vw"
                  className="object-cover object-center"
                />
              )}
            </div>
            <div className="relative hidden sm:block h-full w-full">
              {heroRightImage && (
                <Image
                  src={heroRightImage}
                  alt="Editorial campaign right"
                  fill
                  sizes="33vw"
                  className="object-cover object-center"
                />
              )}
            </div>
          </div>
        ) : (
          /* ═══ 2-Column Split Grid (Default) ═══ */
          <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2">
            <div className="relative h-full w-full">
              {heroLeftImage && (
                <Image
                  src={heroLeftImage}
                  alt={heroTitle || "Editorial campaign"}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-top"
                  priority
                />
              )}
            </div>
            <div className="relative hidden md:block h-full w-full">
              {heroRightImage && (
                <Image
                  src={heroRightImage}
                  alt="Premium cotton fabric texture detail"
                  fill
                  sizes="50vw"
                  className="object-cover"
                />
              )}
            </div>
          </div>
        )}

        {/* Overlay content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
          {/* Subtle dark gradient for text readability */}
          <div className="absolute inset-0 bg-linear-to-b from-black/5 via-black/15 to-black/30 md:from-transparent md:via-black/10 md:to-black/20" />

          <div className="relative z-10 px-4">
            {heroTitle && (
              <h1 className="font-eb-garamond text-[48px] md:text-[72px] font-normal leading-[1.1] tracking-[-0.02em] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.3)]">
                {heroTitle}
              </h1>
            )}
            {heroSubtitle && (
              <p className="mt-3 font-hanken text-[13px] md:text-[14px] font-normal text-white/90 tracking-wide drop-shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
                {heroSubtitle}
              </p>
            )}

            {/* Coming Soon Drop Highlight Countdown Card */}
            {comingSoonProduct?.releaseDate && (
              <div className="mt-5 flex justify-center">
                <CountdownTimer
                  targetDate={comingSoonProduct.releaseDate}
                  variant="hero"
                />
              </div>
            )}

            {/* CTA buttons */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {comingSoonProduct ? (
                <Link
                  href={`/products/${comingSoonProduct.slug}`}
                  className="inline-flex h-9 items-center border border-white bg-white px-4 font-hanken text-[10px] font-semibold uppercase tracking-[0.08em] text-black transition-colors duration-150 hover:bg-white/85"
                >
                  Lihat Drop
                </Link>
              ) : (
                heroCtaText &&
                heroCtaLink && (
                  <Link
                    href={heroCtaLink}
                    className="inline-flex h-9 items-center border border-white bg-white px-4 font-hanken text-[10px] font-semibold uppercase tracking-[0.08em] text-black transition-colors duration-150 hover:bg-white/85"
                  >
                    {heroCtaText}
                  </Link>
                )
              )}
              <Link
                href="/archive"
                className="inline-flex h-9 items-center border border-white/50 px-4 font-hanken text-[10px] font-semibold uppercase tracking-[0.08em] text-white transition-colors duration-150 hover:border-white hover:bg-white/10"
              >
                Arsip
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle bottom edge */}
      <div className="absolute bottom-0 right-4 md:right-16">
        <p className="font-hanken text-[10px] uppercase tracking-widest text-(--cat-on-surface-variant) py-2">
          Edisi selanjutnya →
        </p>
      </div>
    </section>
  );
}
