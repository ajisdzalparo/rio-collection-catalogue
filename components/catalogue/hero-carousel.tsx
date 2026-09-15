'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CountdownTimer } from '@/components/catalogue/countdown-timer';
import { cn } from '@/lib/utils';
import type { Product } from '@/types/catalogue.types';
import type { HeroSlide } from '@/types/store-settings.types';

interface HeroCarouselProps {
  slides: HeroSlide[];
  comingSoonProduct?: Product | null;
}

export function HeroCarousel({ slides, comingSoonProduct }: HeroCarouselProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const slideCount = slides.length;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (slideCount <= 1 || isPaused || reducedMotion) return;
    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % slideCount);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [activeIndex, isPaused, reducedMotion, slideCount]);

  const goToSlide = useCallback(
    (index: number) => {
      if (slideCount === 0) return;
      setActiveIndex((index + slideCount) % slideCount);
    },
    [slideCount]
  );

  const goToPrevious = useCallback(() => {
    goToSlide(activeIndex - 1);
  }, [activeIndex, goToSlide]);

  const goToNext = useCallback(() => {
    goToSlide(activeIndex + 1);
  }, [activeIndex, goToSlide]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (slideCount <= 1) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToPrevious();
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToNext();
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (touchStartX.current === null) return;
    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const distance = touchEndX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(distance) < 40 || slideCount <= 1) return;
    if (distance > 0) goToPrevious();
    else goToNext();
  };

  if (slideCount === 0) {
    return <div className="h-[70vh] md:h-[85vh] bg-(--cat-surface-container-low)" />;
  }

  return (
    <section
      className="relative h-[70vh] min-h-130 md:h-[85vh] md:min-h-160 bg-(--cat-surface-container-low)"
      aria-roledescription="carousel"
      aria-label="Banner utama"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {slides.map((slide, index) => {
        const isActive = index === activeIndex;
        return (
          <article
            key={slide.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-700',
              isActive ? 'z-1 opacity-100' : 'pointer-events-none opacity-0'
            )}
            aria-hidden={!isActive}
            aria-roledescription="slide"
            aria-label={`${index + 1} dari ${slideCount}`}
          >
            {slide.imageUrl ? (
              <Image
                src={slide.imageUrl}
                alt={slide.altText}
                fill
                sizes="100vw"
                priority={index === 0}
                className="object-cover object-center"
              />
            ) : (
              <div className="absolute inset-0 bg-(--cat-surface-container-low)" />
            )}

            <div className="absolute inset-0 bg-linear-to-b from-black/10 via-black/15 to-black/45" />
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center text-white">
              {slide.title && (
                <h1 className="font-eb-garamond text-[48px] md:text-[72px] font-normal leading-[1.1] tracking-[-0.02em] drop-shadow-[0_2px_20px_rgba(0,0,0,0.3)]">
                  {slide.title}
                </h1>
              )}
              {slide.subtitle && (
                <p className="mt-3 font-hanken text-[13px] md:text-[14px] text-white/90 tracking-wide drop-shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
                  {slide.subtitle}
                </p>
              )}

              {comingSoonProduct?.releaseDate && (
                <div className="mt-5 flex justify-center">
                  <CountdownTimer
                    targetDate={comingSoonProduct.releaseDate}
                    variant="hero"
                    onEnded={() => router.refresh()}
                  />
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {comingSoonProduct && isActive ? (
                  <Link
                    href={`/products/${comingSoonProduct.slug}`}
                    className="inline-flex h-9 items-center border border-white bg-white px-4 font-hanken text-[10px] font-semibold uppercase tracking-[0.08em] text-black transition-colors duration-150 hover:bg-white/85"
                  >
                    Lihat Drop
                  </Link>
                ) : (
                  slide.ctaText &&
                  slide.ctaLink && (
                    <Link
                      href={slide.ctaLink}
                      tabIndex={isActive ? 0 : -1}
                      className="inline-flex h-9 items-center border border-white bg-white px-4 font-hanken text-[10px] font-semibold uppercase tracking-[0.08em] text-black transition-colors duration-150 hover:bg-white/85"
                    >
                      {slide.ctaText}
                    </Link>
                  )
                )}
                <Link
                  href="/archive"
                  tabIndex={isActive ? 0 : -1}
                  className="inline-flex h-9 items-center border border-white/50 px-4 font-hanken text-[10px] font-semibold uppercase tracking-[0.08em] text-white transition-colors duration-150 hover:border-white hover:bg-white/10"
                >
                  Arsip
                </Link>
              </div>
            </div>
          </article>
        );
      })}

      {slideCount > 1 && (
        <>
          <button
            type="button"
            className="absolute left-4 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/60 bg-black/20 text-white backdrop-blur-sm transition-colors hover:bg-black/40"
            onClick={goToPrevious}
            aria-label="Banner sebelumnya"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="absolute right-4 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/60 bg-black/20 text-white backdrop-blur-sm transition-colors hover:bg-black/40"
            onClick={goToNext}
            aria-label="Banner berikutnya"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goToSlide(index)}
                className={cn(
                  'h-1.5 transition-all',
                  index === activeIndex ? 'w-8 bg-white' : 'w-3 bg-white/50 hover:bg-white/80'
                )}
                aria-label={`Tampilkan banner ${index + 1}`}
                aria-current={index === activeIndex}
              />
            ))}
          </div>
        </>
      )}

      <div className="absolute bottom-0 right-4 z-20 md:right-16">
        <p className="font-hanken text-[10px] uppercase tracking-widest text-white/80 py-2">
          Edisi selanjutnya →
        </p>
      </div>
    </section>
  );
}
