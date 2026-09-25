'use client';

import React, { useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SafeImageProps extends Omit<ImageProps, 'src'> {
  src?: string | null;
  fallbackSrc?: string;
  showPlaceholderIcon?: boolean;
}

export function SafeImage({
  src,
  fallbackSrc = '/images/placeholder.jpg',
  showPlaceholderIcon = true,
  alt,
  className,
  priority = false,
  ...props
}: SafeImageProps) {
  const [prevSrc, setPrevSrc] = useState<string | null | undefined>(src);
  const [imgSrc, setImgSrc] = useState<string | null | undefined>(src);
  const [isError, setIsError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync state if src changes
  if (src !== prevSrc) {
    setPrevSrc(src);
    setImgSrc(src);
    setIsError(false);
    setIsLoaded(false);
  }

  const handleImageError = () => {
    if (imgSrc && imgSrc !== fallbackSrc && fallbackSrc) {
      setImgSrc(fallbackSrc);
    } else {
      setIsError(true);
    }
  };

  if (!imgSrc || isError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/60 text-muted-foreground">
        {showPlaceholderIcon && <ImageIcon className="h-5 w-5 stroke-[1.5] text-muted-foreground/50" />}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {!isLoaded && !priority && (
        <div className="absolute inset-0 bg-muted/40 animate-pulse" />
      )}
      <Image
        src={imgSrc}
        alt={alt || 'Product Image'}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        priority={priority}
        className={cn(
          'transition-opacity duration-300 ease-out',
          !isLoaded && !priority ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoad={() => setIsLoaded(true)}
        onError={handleImageError}
        {...props}
      />
    </div>
  );
}
