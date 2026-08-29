'use client';

import React, { useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { Image as ImageIcon } from 'lucide-react';

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
  ...props
}: SafeImageProps) {
  const [prevSrc, setPrevSrc] = useState<string | null | undefined>(src);
  const [imgSrc, setImgSrc] = useState<string | null | undefined>(src);
  const [isError, setIsError] = useState(false);

  // Sync state if src changes
  if (src !== prevSrc) {
    setPrevSrc(src);
    setImgSrc(src);
    setIsError(false);
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
      <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
        {showPlaceholderIcon && <ImageIcon className="h-5 w-5 stroke-[1.5]" />}
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt || 'Product Image'}
      className={className}
      onError={handleImageError}
      {...props}
    />
  );
}
