'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Testimony } from '@/types/catalogue.types';

const defaultTestimonials = [
  { tempId: 0, imgSrc: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80', alt: 'Testimonial 1' },
  { tempId: 1, imgSrc: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80', alt: 'Testimonial 2' },
  { tempId: 2, imgSrc: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80', alt: 'Testimonial 3' },
  { tempId: 3, imgSrc: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80', alt: 'Testimonial 4' },
  { tempId: 4, imgSrc: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80', alt: 'Testimonial 5' },
  { tempId: 5, imgSrc: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80', alt: 'Testimonial 6' }
];

interface TestimonialCardProps {
  position: number;
  testimonial: { tempId: number; imgSrc: string; alt: string };
  handleMove: (steps: number) => void;
  cardSize: number;
  onZoom: (imgSrc: string) => void;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  position,
  testimonial,
  handleMove,
  cardSize,
  onZoom
}) => {
  const isCenter = position === 0;
  const absPos = Math.abs(position);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCenter) {
      onZoom(testimonial.imgSrc);
    } else {
      handleMove(position);
    }
  };

  const zIndex = 30 - absPos * 10;
  const scale = isCenter ? 1 : absPos === 1 ? 0.92 : 0.84;

  const translateX =
    position === 0
      ? 0
      : position > 0
        ? cardSize * (0.68 + (absPos - 1) * 0.58)
        : -cardSize * (0.68 + (absPos - 1) * 0.58);

  const rotate =
    position === 0 ? 0 : position > 0 ? (absPos === 1 ? 2.5 : 5) : absPos === 1 ? -2.5 : -5;

  return (
    <div
      onClick={handleClick}
      className={cn(
        'absolute left-1/2 top-1/2 cursor-pointer transition-all duration-500 ease-out group rounded-2xl overflow-hidden bg-background border',
        isCenter
          ? 'border-neutral-800 dark:border-neutral-200 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] opacity-100 ring-1 ring-black/10'
          : absPos === 1
            ? 'border-stone-300 dark:border-stone-700 shadow-[0_15px_30px_-8px_rgba(0,0,0,0.2)] opacity-95 hover:shadow-2xl hover:scale-[0.95]'
            : 'border-stone-200 dark:border-stone-800 shadow-[0_10px_20px_-6px_rgba(0,0,0,0.15)] opacity-85 hover:scale-[0.87]'
      )}
      style={{
        width: cardSize,
        height: cardSize * 1.48,
        zIndex,
        transform: `
          translate(-50%, -50%)
          translateX(${translateX}px)
          translateY(${isCenter ? -14 : absPos === 1 ? 4 : 16}px)
          scale(${scale})
          rotate(${rotate}deg)
        `
      }}
    >
      <div className="relative w-full h-full">
        <Image
          src={testimonial.imgSrc}
          alt={testimonial.alt}
          width={cardSize || 240}
          height={(cardSize || 240) * 1.5}
          sizes="(max-width: 640px) 210px, 260px"
          className="w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Ambient Depth Lighting Overlay for Side Cards */}
        {!isCenter && (
          <div
            className={cn(
              'absolute inset-0 pointer-events-none transition-opacity duration-500',
              absPos === 1 ? 'bg-black/10' : 'bg-black/25'
            )}
          />
        )}

        {/* Hover zoom overlay for center card */}
        {isCenter && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white gap-2">
            <ZoomIn size={24} strokeWidth={2} className="animate-bounce" />
            <span className="font-hanken text-[10px] font-bold uppercase tracking-widest">
              Klik untuk Perbesar
            </span>
          </div>
        )}

        {/* Refined Verified Badge */}
        {isCenter && (
          <div className="absolute top-3.5 right-3.5 bg-neutral-950/85 dark:bg-white/90 text-white dark:text-neutral-900 px-2.5 py-1 text-[9px] font-hanken uppercase tracking-widest rounded-full font-bold flex items-center gap-1.5 shadow-md border border-white/20 dark:border-black/20 z-20 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Verified Chat</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface StaggerTestimonialsProps {
  items?: Testimony[];
}

export const StaggerTestimonials: React.FC<StaggerTestimonialsProps> = ({ items }) => {
  const [cardSize, setCardSize] = useState(240);

  const initialList = useMemo(() => {
    if (items && items.length > 0) {
      return items.map((item, idx) => ({
        tempId: idx,
        imgSrc: item.imageUrl,
        alt: item.alt || item.clientName || `Testimonial ${idx + 1}`
      }));
    }
    return defaultTestimonials;
  }, [items]);

  const [testimonialsList, setTestimonialsList] = useState(initialList);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [prevItems, setPrevItems] = useState(items);

  if (items !== prevItems) {
    setPrevItems(items);
    setTestimonialsList(initialList);
  }

  const handleMove = (steps: number) => {
    const newList = [...testimonialsList];
    if (steps > 0) {
      for (let i = steps; i > 0; i--) {
        const item = newList.shift();
        if (!item) return;
        newList.push({ ...item, tempId: Math.random() });
      }
    } else {
      for (let i = steps; i < 0; i++) {
        const item = newList.pop();
        if (!item) return;
        newList.unshift({ ...item, tempId: Math.random() });
      }
    }
    setTestimonialsList(newList);
  };

  useEffect(() => {
    const updateSize = () => {
      const { matches } = window.matchMedia('(min-width: 640px)');
      setCardSize(matches ? 260 : 210);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <>
      <div
        className="relative w-full overflow-hidden bg-(--cat-surface-bright) py-10 border-t border-b border-(--cat-stone)/50"
        style={{ height: 500 }}
      >
        {/* Soft Ambient Floor Shadow under Center Card */}
        <div className="absolute top-[68%] left-1/2 -translate-x-1/2 w-70 sm:w-85 h-6 bg-black/25 blur-xl rounded-full pointer-events-none z-0" />

        {testimonialsList.map((testimonial, index) => {
          const centerIndex = Math.floor(testimonialsList.length / 2);
          const position = index - centerIndex;

          if (Math.abs(position) > 2) return null;

          return (
            <TestimonialCard
              key={testimonial.tempId}
              testimonial={testimonial}
              handleMove={handleMove}
              position={position}
              cardSize={cardSize}
              onZoom={setZoomedImage}
            />
          );
        })}

        {/* Control Buttons & Indicators */}
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3 z-30">
          <button
            onClick={() => handleMove(-1)}
            className="flex h-11 w-11 items-center justify-center transition-all rounded-full border border-stone-300 dark:border-stone-700 bg-background text-foreground hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900 shadow-xs cursor-pointer hover:scale-105 active:scale-95"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={18} strokeWidth={2} />
          </button>

          <button
            onClick={() => handleMove(1)}
            className="flex h-11 w-11 items-center justify-center transition-all rounded-full border border-stone-300 dark:border-stone-700 bg-background text-foreground hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900 shadow-xs cursor-pointer hover:scale-105 active:scale-95"
            aria-label="Next testimonial"
          >
            <ChevronRight size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Lightbox / Zoomed Image Modal */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 transition-opacity duration-300 animate-in fade-in cursor-pointer"
        >
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-5 right-5 text-white hover:text-gray-300 transition-colors p-2.5 bg-neutral-800/80 rounded-full cursor-pointer border border-white/10"
            aria-label="Close zoomed view"
          >
            <X size={20} />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-[90vw] max-h-[85vh] aspect-9/16 overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-950 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <Image
              src={zoomedImage}
              alt="Zoomed testimonial screenshot"
              width={540}
              height={960}
              priority
              className="object-contain w-full h-full rounded-xl"
            />
          </div>
        </div>
      )}
    </>
  );
};
