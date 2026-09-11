'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number; // 0 - 5
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
  showValue?: boolean;
  totalReviews?: number;
}

export function StarRating({
  rating,
  maxStars = 5,
  size = 16,
  interactive = false,
  onChange,
  className,
  showValue = false,
  totalReviews
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = displayRating >= starValue;
          const isHalf = !isFilled && displayRating >= starValue - 0.5;

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange?.(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={cn(
                'transition-transform',
                interactive ? 'cursor-pointer hover:scale-110 p-0.5' : 'cursor-default pointer-events-none'
              )}
              aria-label={`${starValue} Bintang`}
            >
              <Star
                size={size}
                className={cn(
                  'transition-colors',
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : isHalf
                      ? 'fill-amber-400/50 text-amber-400'
                      : 'fill-transparent text-(--cat-stone)'
                )}
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="font-hanken text-[13px] font-medium text-(--cat-on-surface) ml-1 tabular-nums">
          {rating > 0 ? rating.toFixed(1) : '0.0'}
        </span>
      )}

      {totalReviews !== undefined && (
        <span className="font-hanken text-[12px] text-(--cat-on-surface-variant)">
          ({totalReviews})
        </span>
      )}
    </div>
  );
}
