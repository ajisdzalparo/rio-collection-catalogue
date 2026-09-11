'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ZoomIn, X, CheckCircle2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Testimony } from '@/types/catalogue.types';

export interface TestimonyCarouselProps {
  items: Testimony[];
}

export function TestimonyCarousel({ items }: TestimonyCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomedItem, setZoomedItem] = useState<Testimony | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const total = items.length;

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  }, [total]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  }, [total]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (zoomedItem) {
        if (e.key === 'Escape') setZoomedItem(null);
        return;
      }
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, zoomedItem]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
    setTouchStartX(null);
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden py-4 sm:py-8 select-none">
      {/* Cards Stage Container */}
      <div
        className="relative mx-auto flex items-center justify-center h-135 sm:h-150 w-full max-w-5xl"
        style={{ perspective: '1200px' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {items.map((item, index) => {
          // Calculate cyclic/relative offset
          let offset = (index - activeIndex) % total;
          if (offset > total / 2) offset -= total;
          if (offset < -total / 2) offset += total;

          // Enforce strict symmetry: 1 card each side if < 5 items, 2 each side if >= 5 items
          const maxVisibleSide = total >= 5 ? 2 : 1;
          const absOffset = Math.abs(offset);

          if (absOffset > maxVisibleSide) return null;

          const isCenter = offset === 0;

          // Responsive mirror translate & rotate values
          const xDesktop =
            offset === 0
              ? 0
              : offset > 0
                ? 300 + (absOffset - 1) * 200
                : -300 - (absOffset - 1) * 200;
          const xMobile = offset === 0 ? 0 : offset > 0 ? 190 : -190;
          const rotateY = offset === 0 ? 0 : offset > 0 ? -14 : 14;
          const scale = offset === 0 ? 1 : absOffset === 1 ? 0.88 : 0.76;

          return (
            <div
              key={item.id || index}
              onClick={() => {
                if (isCenter) {
                  setZoomedItem(item);
                } else {
                  setActiveIndex(index);
                }
              }}
              style={{
                zIndex: isCenter ? 30 : 20 - absOffset,
                transform: `translateX(${
                  typeof window !== 'undefined' && window.innerWidth < 640 ? xMobile : xDesktop
                }px) scale(${scale}) rotateY(${rotateY}deg)`
              }}
              className={cn(
                'absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-out cursor-pointer group',
                'w-65 sm:w-72.5 rounded-2xl overflow-hidden',
                'bg-neutral-950 border text-white opacity-100',
                isCenter
                  ? 'border-neutral-700/80 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.55)] ring-1 ring-white/15'
                  : 'border-neutral-800 shadow-2xl hover:border-neutral-700'
              )}
            >
              {/* Dimmed depth overlay for side cards (darkens surface without making card see-through) */}
              {!isCenter && (
                <div className="absolute inset-0 bg-black/45 z-20 pointer-events-none transition-colors duration-300 group-hover:bg-black/20" />
              )}

              {/* Smartphone-like Minimal Top Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-950 border-b border-neutral-800/80">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-hanken text-[10px] font-semibold uppercase tracking-widest text-neutral-300">
                    WhatsApp Chat
                  </span>
                </div>
                <span className="font-hanken text-[10px] text-neutral-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  Verified
                </span>
              </div>

              {/* Central WhatsApp Screenshot Body */}
              <div className="relative aspect-9/16 w-full bg-neutral-950 overflow-hidden">
                <Image
                  src={item.imageUrl}
                  alt={item.alt || item.clientName || 'Bukti Chat WhatsApp'}
                  fill
                  sizes="(max-width: 640px) 260px, 290px"
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                  priority={isCenter}
                />

                {/* Glassy hover overlay to zoom (only active on center card) */}
                {isCenter && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white text-neutral-950 font-hanken text-[11px] font-bold tracking-wide shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <ZoomIn className="h-3.5 w-3.5" />
                      <span>Perbesar Chat</span>
                    </div>
                  </div>
                )}

                {/* Subtle gradient vignette at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-neutral-950 via-neutral-950/60 to-transparent pointer-events-none" />
              </div>

              {/* Card Footer: Client Info */}
              <div className="px-4 py-3 bg-neutral-950 border-t border-neutral-800/80">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-hanken text-[12px] font-semibold text-white truncate">
                      {item.clientName || 'Pelanggan RIO Collection'}
                    </p>
                    <p className="font-hanken text-[10px] text-neutral-400 truncate">
                      {item.alt && item.alt !== item.clientName
                        ? item.alt
                        : 'Bukti Chat & Konfirmasi Pesanan'}
                    </p>
                  </div>
                  {isCenter && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomedItem(item);
                      }}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors shrink-0 ml-2"
                      title="Perbesar gambar"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Controls */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={handlePrev}
            className="h-10 w-10 rounded-full border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs active:scale-95"
            aria-label="Testimoni sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Indicator Counter & Dots */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xs">
            <span className="font-hanken text-[11px] font-semibold text-neutral-800 dark:text-neutral-200">
              {String(activeIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
          </div>

          <button
            onClick={handleNext}
            className="h-10 w-10 rounded-full border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs active:scale-95"
            aria-label="Testimoni berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Lightbox / Fullscreen Zoom Modal */}
      {zoomedItem && (
        <div
          onClick={() => setZoomedItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6 transition-opacity duration-200 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex flex-col items-center max-w-lg w-full max-h-[92vh] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/80">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-hanken text-xs font-semibold text-white truncate">
                    {zoomedItem.clientName || 'Pelanggan RIO Collection'}
                  </p>
                  <p className="font-hanken text-[10px] text-neutral-400 truncate">
                    Bukti Chat Transaksi Asli
                  </p>
                </div>
              </div>
              <button
                onClick={() => setZoomedItem(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Tutup preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Image Display */}
            <div className="relative w-full flex-1 min-h-100 max-h-[75vh] p-2 bg-neutral-950 flex items-center justify-center overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={zoomedItem.imageUrl}
                alt={zoomedItem.alt || zoomedItem.clientName || 'Bukti Chat WhatsApp'}
                className="max-h-[72vh] w-auto object-contain rounded-lg shadow-md select-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
