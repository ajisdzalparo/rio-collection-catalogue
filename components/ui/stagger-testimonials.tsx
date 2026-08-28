'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// We map our 3 WhatsApp chat screenshot images into a list of 12 items to show volume
const testimonials = [
  { tempId: 0, imgSrc: '/images/testimonials/testimony-1.png', alt: 'Testimonial 1' },
  { tempId: 1, imgSrc: '/images/testimonials/testimony-2.png', alt: 'Testimonial 2' },
  { tempId: 2, imgSrc: '/images/testimonials/testimony-3.png', alt: 'Testimonial 3' },
  { tempId: 3, imgSrc: '/images/testimonials/testimony-1.png', alt: 'Testimonial 4' },
  { tempId: 4, imgSrc: '/images/testimonials/testimony-2.png', alt: 'Testimonial 5' },
  { tempId: 5, imgSrc: '/images/testimonials/testimony-3.png', alt: 'Testimonial 6' },
  { tempId: 6, imgSrc: '/images/testimonials/testimony-1.png', alt: 'Testimonial 7' },
  { tempId: 7, imgSrc: '/images/testimonials/testimony-2.png', alt: 'Testimonial 8' },
  { tempId: 8, imgSrc: '/images/testimonials/testimony-3.png', alt: 'Testimonial 9' },
  { tempId: 9, imgSrc: '/images/testimonials/testimony-1.png', alt: 'Testimonial 10' },
  { tempId: 10, imgSrc: '/images/testimonials/testimony-2.png', alt: 'Testimonial 11' },
  { tempId: 11, imgSrc: '/images/testimonials/testimony-3.png', alt: 'Testimonial 12' },
];

interface TestimonialCardProps {
  position: number;
  testimonial: typeof testimonials[0];
  handleMove: (steps: number) => void;
  cardSize: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  position,
  testimonial,
  handleMove,
  cardSize,
}) => {
  const isCenter = position === 0;

  return (
    <div
      onClick={() => handleMove(position)}
      className={cn(
        'absolute left-1/2 top-1/2 cursor-pointer border rounded-2xl overflow-hidden transition-all duration-500 ease-in-out bg-[#e5ddd5]/30',
        isCenter
          ? 'z-10 border-[var(--cat-charcoal)] shadow-[0_12px_40px_rgba(0,0,0,0.15)] opacity-100 scale-100'
          : 'z-0 border-[var(--cat-stone)]/40 opacity-40 hover:opacity-75 scale-90'
      )}
      style={{
        width: cardSize,
        height: cardSize * 1.5, // Vertical aspect ratio for phone screens
        transform: `
          translate(-50%, -50%)
          translateX(${(cardSize * 0.95) * position}px)
          translateY(${isCenter ? -10 : position % 2 ? 10 : -10}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
        `,
      }}
    >
      <div className="relative w-full h-full">
        <img
          src={testimonial.imgSrc}
          alt={testimonial.alt}
          className="w-full h-full object-cover select-none pointer-events-none"
        />
        {/* Verification indicator */}
        <div className="absolute top-3 right-3 bg-[var(--cat-charcoal)]/80 backdrop-blur-xs text-white px-2 py-0.5 text-[9px] font-[family-name:var(--font-hanken)] uppercase tracking-wider rounded-xs font-semibold">
          Verified Chat
        </div>
      </div>
    </div>
  );
};

export const StaggerTestimonials: React.FC = () => {
  const [cardSize, setCardSize] = useState(240);
  const [testimonialsList, setTestimonialsList] = useState(testimonials);

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
    <div
      className="relative w-full overflow-hidden bg-[var(--cat-surface-bright)] py-8 border-t border-b border-[var(--cat-stone)]/50"
      style={{ height: 500 }}
    >
      {testimonialsList.map((testimonial, index) => {
        const position = testimonialsList.length % 2
          ? index - (testimonialsList.length + 1) / 2
          : index - testimonialsList.length / 2;

        // Only render cards that are relatively close to center for performance and layout focus
        if (Math.abs(position) > 2) return null;

        return (
          <TestimonialCard
            key={testimonial.tempId}
            testimonial={testimonial}
            handleMove={handleMove}
            position={position}
            cardSize={cardSize}
          />
        );
      })}
      
      {/* Control Buttons */}
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-3 z-20">
        <button
          onClick={() => handleMove(-1)}
          className={cn(
            'flex h-12 w-12 items-center justify-center transition-colors rounded-full border border-[var(--cat-stone)] bg-[var(--cat-surface)] hover:bg-[var(--cat-charcoal)] hover:text-white cursor-pointer'
          )}
          aria-label="Previous testimonial"
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => handleMove(1)}
          className={cn(
            'flex h-12 w-12 items-center justify-center transition-colors rounded-full border border-[var(--cat-stone)] bg-[var(--cat-surface)] hover:bg-[var(--cat-charcoal)] hover:text-white cursor-pointer'
          )}
          aria-label="Next testimonial"
        >
          <ChevronRight size={20} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};
