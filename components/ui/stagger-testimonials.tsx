'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Testimony } from '@/types/catalogue.types';

const CUT_SIZE = 50;
const SQRT_5000 = Math.sqrt(5000); // 70.71px for a 50px cut corner

export interface TestimonialItem {
  tempId: number | string;
  testimonial: string;
  by: string;
  imgSrc: string;
  alt?: string;
}

interface TestimonialCardProps {
  position: number;
  testimonial: TestimonialItem;
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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCenter) {
      if (testimonial.imgSrc) {
        onZoom(testimonial.imgSrc);
      }
    } else {
      handleMove(position);
    }
  };

  const zIndex = isCenter ? 25 : Math.max(1, 15 - Math.abs(position) * 3);

  return (
    <div
      onClick={handleClick}
      className={cn(
        'absolute left-1/2 top-1/2 cursor-pointer border-2 transition-all duration-500 ease-in-out select-none flex flex-col justify-between p-6 sm:p-8',
        isCenter
          ? 'bg-[#eaeaea] text-black border-neutral-900 ring-1 ring-black/10'
          : 'bg-[#141416] text-white border-neutral-800 hover:border-neutral-600 opacity-90 hover:opacity-100'
      )}
      style={{
        width: cardSize,
        height: cardSize,
        zIndex,
        clipPath: `polygon(0% 0%, calc(100% - ${CUT_SIZE}px) 0%, 100% ${CUT_SIZE}px, 100% 100%, 0% 100%)`,
        transform: `
          translate(-50%, -50%)
          translateX(${(cardSize / 1.45) * position}px)
          translateY(${isCenter ? -55 : position % 2 ? 15 : -15}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
        `,
        boxShadow: isCenter ? '0px 10px 0px 4px rgba(0,0,0,0.85)' : 'none'
      }}
    >
      {/* 45-degree angled border line for the top-right cut corner */}
      <span
        className={cn(
          'absolute block origin-top-right rotate-45 pointer-events-none z-20',
          isCenter ? 'bg-neutral-900' : 'bg-neutral-800'
        )}
        style={{
          right: -2,
          top: CUT_SIZE - 2,
          width: SQRT_5000,
          height: 2
        }}
      />

      {/* Top: WhatsApp chat thumbnail photo & indicator */}
      <div className="flex items-center justify-between">
        <div className="relative group/thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={testimonial.imgSrc}
            alt={testimonial.alt || testimonial.by}
            className="h-14 w-12 bg-neutral-800 object-cover object-top border border-neutral-500/30"
            style={{
              boxShadow: isCenter
                ? '3px 3px 0px rgba(0,0,0,0.85)'
                : '3px 3px 0px rgba(255,255,255,0.2)'
            }}
          />
          {isCenter && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
              <ZoomIn size={14} />
            </div>
          )}
        </div>

        {/* WhatsApp Badge */}
        <div
          className={cn(
            'text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 border flex items-center gap-1.5',
            isCenter
              ? 'border-neutral-900 bg-white/80 text-neutral-900'
              : 'border-neutral-700 bg-neutral-900/90 text-neutral-300'
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>WhatsApp Proof</span>
        </div>
      </div>

      {/* Middle: Testimonial Quote */}
      <div className="my-auto py-2">
        <h3
          className={cn(
            'text-sm sm:text-base md:text-lg font-medium leading-snug line-clamp-4',
            isCenter ? 'text-neutral-950 font-semibold' : 'text-neutral-100'
          )}
        >
          &ldquo;{testimonial.testimonial}&rdquo;
        </h3>

        {isCenter && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onZoom(testimonial.imgSrc);
            }}
            className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-700 hover:text-black transition-colors cursor-pointer"
          >
            <ZoomIn size={12} />
            <span>Lihat Tangkapan Layar Chat</span>
          </button>
        )}
      </div>

      {/* Bottom: Author Citation matching screenshot */}
      <p
        className={cn(
          'text-xs sm:text-sm italic font-hanken truncate',
          isCenter ? 'text-neutral-800' : 'text-neutral-400'
        )}
      >
        - {testimonial.by}
      </p>
    </div>
  );
};

export interface StaggerTestimonialsProps {
  items?: Testimony[] | TestimonialItem[];
}

export const StaggerTestimonials: React.FC<StaggerTestimonialsProps> = ({ items }) => {
  const [cardSize, setCardSize] = useState(365);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const initialList = useMemo(() => {
    if (items && items.length > 0) {
      return items.map((item, idx) => ({
        tempId: 'id' in item && item.id ? item.id : idx,
        testimonial:
          'alt' in item && item.alt
            ? item.alt
            : 'clientName' in item && item.clientName
              ? `Review & kepuasan pesanan oleh ${item.clientName}`
              : 'testimonial' in item
                ? (item as TestimonialItem).testimonial
                : `Percakapan WhatsApp Pelanggan #${idx + 1}`,
        by:
          'clientName' in item && item.clientName
            ? item.clientName
            : 'by' in item
              ? (item as TestimonialItem).by
              : `Pelanggan Terverifikasi #${idx + 1}`,
        imgSrc:
          'imageUrl' in item && item.imageUrl
            ? item.imageUrl
            : 'imgSrc' in item
              ? (item as TestimonialItem).imgSrc
              : '',
        alt: 'alt' in item && item.alt ? item.alt : undefined
      }));
    }
    return [];
  }, [items]);

  const [testimonialsList, setTestimonialsList] = useState<TestimonialItem[]>(initialList);
  const [prevItems, setPrevItems] = useState(items);

  if (items !== prevItems) {
    setPrevItems(items);
    setTestimonialsList(initialList);
  }

  const handleMove = (steps: number) => {
    if (testimonialsList.length <= 1) return;
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
      setCardSize(matches ? 365 : 290);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  if (!testimonialsList || testimonialsList.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className="relative w-full overflow-hidden bg-neutral-950 py-12 border-y border-neutral-800"
        style={{ height: 600 }}
      >
        {/* Soft Ambient Floor Shadow under Center Card */}
        <div className="absolute top-[68%] left-1/2 -translate-x-1/2 w-72 sm:w-96 h-6 bg-black/40 blur-xl pointer-events-none z-0" />

        {testimonialsList.map((testimonial, index) => {
          const centerIndex = Math.floor(testimonialsList.length / 2);
          const position = index - centerIndex;

          // Render only cards that fit on screen for performance
          if (Math.abs(position) > 3) return null;

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

        {/* Sharp Square Navigation Buttons */}
        {testimonialsList.length > 1 && (
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-3 z-30">
            <button
              onClick={() => handleMove(-1)}
              className={cn(
                'flex h-13 w-13 items-center justify-center text-xl transition-colors cursor-pointer',
                'bg-neutral-900 border-2 border-neutral-700 text-white hover:bg-white hover:text-black',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 shadow-md'
              )}
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={22} strokeWidth={2} />
            </button>

            <button
              onClick={() => handleMove(1)}
              className={cn(
                'flex h-13 w-13 items-center justify-center text-xl transition-colors cursor-pointer',
                'bg-neutral-900 border-2 border-neutral-700 text-white hover:bg-white hover:text-black',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 shadow-md'
              )}
              aria-label="Next testimonial"
            >
              <ChevronRight size={22} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

      {/* Lightbox / Zoomed WhatsApp Screenshot Modal */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 transition-opacity duration-300 animate-in fade-in cursor-pointer"
        >
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-5 right-5 text-white hover:text-gray-300 transition-colors p-2.5 bg-neutral-900 rounded-none cursor-pointer border border-white/20"
            aria-label="Close zoomed view"
          >
            <X size={20} strokeWidth={2} />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-[90vw] max-h-[85vh] aspect-9/16 overflow-hidden rounded-none border-2 border-neutral-700 bg-neutral-950 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomedImage}
              alt="Zoomed WhatsApp screenshot"
              className="object-contain w-full h-full select-none"
            />
          </div>
        </div>
      )}
    </>
  );
};
