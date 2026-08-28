import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
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
              src="/images/brand/hero-editorial.jpg"
              alt="RIO COLLECTION — Edition 001 editorial campaign"
              fill
              sizes="50vw"
              className="object-cover object-top"
              priority
            />
          </div>
          {/* Right: Texture close-up */}
          <div className="relative">
            <Image
              src="/images/brand/hero-texture.jpg"
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
              src="/images/brand/hero-editorial.jpg"
              alt="RIO COLLECTION — Edition 001 editorial campaign"
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
          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/15 to-black/30 md:from-transparent md:via-black/10 md:to-black/20" />

          <div className="relative z-10 px-4">
            <h1 className="font-[family-name:var(--font-eb-garamond)] text-[48px] md:text-[72px] font-normal leading-[1.1] tracking-[-0.02em] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.3)]">
              EDITION 001
            </h1>
            <p className="mt-3 font-[family-name:var(--font-hanken)] text-[13px] md:text-[14px] font-normal text-white/90 tracking-wide drop-shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
              Eksplorasi siluet dan tekstur dalam jumlah terbatas.
            </p>

            {/* CTA buttons */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                href="/catalogue"
                className="inline-flex items-center px-6 py-2.5 bg-[var(--cat-charcoal)] text-white font-[family-name:var(--font-hanken)] text-[11px] font-semibold uppercase tracking-[0.08em] hover:opacity-85 transition-opacity duration-150"
              >
                Eksplor Koleksi
              </Link>
              <Link
                href="/archive"
                className="inline-flex items-center px-6 py-2.5 border border-white/80 text-white font-[family-name:var(--font-hanken)] text-[11px] font-semibold uppercase tracking-[0.08em] hover:bg-white/10 transition-colors duration-150"
              >
                Lihat Arsip
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle bottom edge */}
      <div className="absolute bottom-0 right-4 md:right-16">
        <p className="font-[family-name:var(--font-hanken)] text-[10px] uppercase tracking-[0.1em] text-[var(--cat-on-surface-variant)] py-2">
          Edisi selanjutnya →
        </p>
      </div>
    </section>
  );
}
