'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useStoreSettingsQuery, useStoreSettingsStore } from '@/hooks/use-store-settings';

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  const { data: settings } = useStoreSettingsQuery();
  const store = useStoreSettingsStore();

  const heroTitle = settings?.heroTitle || store.heroTitle || 'EDITION 001';
  const heroSubtitle = settings?.heroSubtitle || store.heroSubtitle || 'Eksplorasi siluet dan tekstur dalam jumlah terbatas.';
  const heroLeftImage = settings?.heroLeftImage || store.heroLeftImage || 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&auto=format&fit=crop&q=80';
  const heroRightImage = settings?.heroRightImage || store.heroRightImage || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&auto=format&fit=crop&q=80';
  const heroCtaText = settings?.heroCtaText || store.heroCtaText || 'Eksplor Koleksi';
  const heroCtaLink = settings?.heroCtaLink || store.heroCtaLink || '/catalogue';

  return (
    <section
      className={cn('relative w-full overflow-hidden', className)}
      aria-label="Hero — Edition 001"
    >
      {/* Desktop: two-column image layout */}
      <div className="relative w-full h-[70vh] md:h-[85vh]">
        {/* Image grid — two side-by-side images */}
        <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2">
          {/* Left: Model shot */}
          <div className="relative hidden md:block">
            <Image
              src={heroLeftImage}
              alt="RIO COLLECTION editorial campaign"
              fill
              sizes="50vw"
              className="object-cover object-top"
              priority
            />
          </div>
          {/* Right: Texture close-up */}
          <div className="relative">
            <Image
              src={heroRightImage}
              alt="Premium cotton fabric texture detail"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>
          {/* Mobile: show editorial as full background */}
          <div className="absolute inset-0 md:hidden">
            <Image
              src={heroLeftImage}
              alt="RIO COLLECTION editorial campaign"
              fill
              sizes="100vw"
              className="object-cover object-top"
              priority
            />
          </div>
        </div>

        {/* Overlay content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
          {/* Subtle dark gradient for text readability */}
          <div className="absolute inset-0 bg-linear-to-b from-black/5 via-black/15 to-black/30 md:from-transparent md:via-black/10 md:to-black/20" />

          <div className="relative z-10 px-4">
            <h1 className="font-eb-garamond text-[48px] md:text-[72px] font-normal leading-[1.1] tracking-[-0.02em] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.3)]">
              {heroTitle}
            </h1>
            <p className="mt-3 font-hanken text-[13px] md:text-[14px] font-normal text-white/90 tracking-wide drop-shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
              {heroSubtitle}
            </p>

            {/* CTA buttons */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                href={heroCtaLink}
                className="inline-flex items-center px-6 py-2.5 bg-(--cat-charcoal) text-white font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] hover:opacity-85 transition-opacity duration-150"
              >
                {heroCtaText}
              </Link>
              <Link
                href="/archive"
                className="inline-flex items-center px-6 py-2.5 border border-white/80 text-white font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] hover:bg-white/10 transition-colors duration-150"
              >
                Lihat Arsip
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
