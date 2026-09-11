'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Check,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crop as CropIcon,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type AspectRatioOption = '1:1' | '3:4' | '4:5' | '16:9' | '9:16' | 'free' | number;

export interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File, previewUrl: string) => void;
  defaultAspectRatio?: AspectRatioOption;
  title?: string;
}

const RATIO_PRESETS: { label: string; value: AspectRatioOption; ratio: number | null }[] = [
  { label: '3:4 (Katalog)', value: '3:4', ratio: 3 / 4 },
  { label: '1:1 (Persegi)', value: '1:1', ratio: 1 },
  { label: '4:5 (Manifesto)', value: '4:5', ratio: 4 / 5 },
  { label: '16:9 (Banner)', value: '16:9', ratio: 16 / 9 },
  { label: '9:16 (Testimoni)', value: '9:16', ratio: 9 / 16 },
  { label: 'Bebas', value: 'free', ratio: null }
];

function resolveRatioNumber(option?: AspectRatioOption): number | null {
  if (!option || option === 'free') return null;
  if (typeof option === 'number') return option;
  switch (option) {
    case '1:1':
      return 1;
    case '3:4':
      return 3 / 4;
    case '4:5':
      return 4 / 5;
    case '16:9':
      return 16 / 9;
    case '9:16':
      return 9 / 16;
    default:
      return null;
  }
}

export function ImageCropperModal(props: ImageCropperModalProps) {
  if (!props.isOpen) return null;

  return (
    <ImageCropperModalContent
      key={`${props.imageSrc}-${props.defaultAspectRatio ?? '3:4'}`}
      {...props}
    />
  );
}

function ImageCropperModalContent({
  imageSrc,
  onClose,
  onCropComplete,
  defaultAspectRatio = '3:4',
  title = 'Sesuaikan & Potong Foto'
}: ImageCropperModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<AspectRatioOption>(defaultAspectRatio);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // in degrees: 0, 90, 180, 270
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 500, height: 400 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Convert remote cross-origin URLs through same-origin proxy to prevent tainted canvas SecurityError
  const safeImageSrc = useMemo(() => {
    if (!imageSrc) return '';
    if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
      try {
        const parsed = new URL(imageSrc);
        if (typeof window !== 'undefined' && parsed.origin === window.location.origin) {
          return imageSrc;
        }
      } catch {
        // continue to proxy
      }
      return `/api/v1/proxy-image?url=${encodeURIComponent(imageSrc)}`;
    }
    return imageSrc;
  }, [imageSrc]);

  // Sync natural size if image is already cached
  useEffect(() => {
    if (imageRef.current && imageRef.current.complete && imageRef.current.naturalWidth > 0) {
      setImgNaturalSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      });
    }
  }, [safeImageSrc]);

  // Measure container dimensions
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const activeRatio = resolveRatioNumber(selectedPreset);

  // Compute crop box inside container with margin
  const getCropBoxDimensions = useCallback(() => {
    const margin = 32;
    const maxW = Math.max(100, containerSize.width - margin * 2);
    const maxH = Math.max(100, containerSize.height - margin * 2);

    if (!activeRatio) {
      // Free aspect ratio: use 80% of container or image natural aspect
      const natRatio =
        imgNaturalSize.width && imgNaturalSize.height
          ? imgNaturalSize.width / imgNaturalSize.height
          : 1;
      let w = maxW;
      let h = w / natRatio;
      if (h > maxH) {
        h = maxH;
        w = h * natRatio;
      }
      return { width: Math.round(w), height: Math.round(h) };
    }

    let w = maxW;
    let h = w / activeRatio;
    if (h > maxH) {
      h = maxH;
      w = h * activeRatio;
    }
    return { width: Math.round(w), height: Math.round(h) };
  }, [containerSize, activeRatio, imgNaturalSize]);

  const cropBox = getCropBoxDimensions();

  // Handle Drag / Pan Events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null);

  // Touch handlers for mobile devices (drag & pinch-to-zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
      pinchRef.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchRef.current = { startDist: dist, startZoom: zoom };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      setPan({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    } else if (e.touches.length === 2 && pinchRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleChange = dist / pinchRef.current.startDist;
      const newZoom = Math.min(
        3,
        Math.max(0.6, Number((pinchRef.current.startZoom * scaleChange).toFixed(2)))
      );
      setZoom(newZoom);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setIsDragging(false);
      pinchRef.current = null;
    } else if (e.touches.length === 1) {
      pinchRef.current = null;
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(3, Math.max(0.6, Number((prev + zoomFactor).toFixed(2)))));
  };

  const rotate90 = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const resetTransform = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // Generate cropped image using Canvas API
  const handleApplyCrop = async () => {
    if (!imageRef.current || !imgNaturalSize.width || !imgNaturalSize.height) return;

    const img = imageRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Target export resolution: keep high fidelity (max 1800px on long edge)
    const exportWidth = Math.min(1800, Math.max(800, cropBox.width * 2));
    const exportHeight = Math.round(
      activeRatio ? exportWidth / activeRatio : (exportWidth * cropBox.height) / cropBox.width
    );

    canvas.width = exportWidth;
    canvas.height = exportHeight;

    // Background smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fill background with black or neutral for transparent PNGs
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportWidth, exportHeight);

    // Calculate transformations
    const scaleFactor = exportWidth / cropBox.width;

    ctx.save();
    // Move origin to canvas center
    ctx.translate(exportWidth / 2, exportHeight / 2);

    // Apply pan translated to exported coordinate space
    ctx.translate(pan.x * scaleFactor, pan.y * scaleFactor);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply zoom
    ctx.scale(zoom, zoom);

    // Determine how image was displayed
    // In CSS: image was fitted so that its base size fits in crop box or container
    const isRotated90or270 = rotation === 90 || rotation === 270;
    const effectiveNatW = isRotated90or270 ? imgNaturalSize.height : imgNaturalSize.width;
    const effectiveNatH = isRotated90or270 ? imgNaturalSize.width : imgNaturalSize.height;

    // Scale to cover crop box at zoom = 1
    const coverScale = Math.max(cropBox.width / effectiveNatW, cropBox.height / effectiveNatH);

    const drawW = imgNaturalSize.width * coverScale * scaleFactor;
    const drawH = imgNaturalSize.height * coverScale * scaleFactor;

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Helper to finish cropping with a File and preview URL
    const finishCrop = (blobOrDataUrl: Blob | string) => {
      const fileName = `cropped-${Date.now()}.webp`;
      if (blobOrDataUrl instanceof Blob) {
        const croppedFile = new File([blobOrDataUrl], fileName, { type: 'image/webp' });
        const previewUrl = URL.createObjectURL(blobOrDataUrl);
        onCropComplete(croppedFile, previewUrl);
      } else {
        // Data URL
        const arr = blobOrDataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/webp';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const croppedFile = new File([u8arr], fileName, { type: mime });
        onCropComplete(croppedFile, blobOrDataUrl);
      }
      onClose();
    };

    // Export as WebP/JPEG blob with fallback
    try {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            try {
              const dataUrl = canvas.toDataURL('image/webp', 0.92);
              finishCrop(dataUrl);
            } catch (fallbackErr) {
              console.error('Canvas toDataURL fallback failed:', fallbackErr);
            }
            return;
          }
          finishCrop(blob);
        },
        'image/webp',
        0.92
      );
    } catch (err) {
      console.warn('canvas.toBlob error, attempting toDataURL:', err);
      try {
        const dataUrl = canvas.toDataURL('image/webp', 0.92);
        finishCrop(dataUrl);
      } catch (fallbackErr) {
        console.error('All canvas export methods failed:', fallbackErr);
        alert('Gagal mengekspor hasil crop gambar.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-5 sm:py-3.5 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <CropIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-foreground truncate">{title}</h2>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                Geser posisi foto &amp; atur zoom agar pas di bingkai
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <Button
              type="button"
              size="sm"
              onClick={handleApplyCrop}
              className="h-8 px-3 text-xs font-bold gap-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 cursor-pointer shadow-xs"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Simpan Crop</span>
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Ratio Selector Tabs */}
        <div className="px-4 py-2 sm:px-5 sm:py-2.5 bg-muted/10 border-b border-border flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground mr-1 shrink-0 uppercase tracking-wider">
            Rasio:
          </span>
          {RATIO_PRESETS.map((preset) => {
            const isSelected = selectedPreset === preset.value;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setSelectedPreset(preset.value);
                  setPan({ x: 0, y: 0 });
                }}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer border',
                  isSelected
                    ? 'bg-foreground text-background border-foreground shadow-xs'
                    : 'bg-card text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/40'
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Canvas & Interactive Viewport */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          className="relative flex-1 min-h-55 max-h-[58vh] bg-neutral-950 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none"
        >
          {/* Hidden natural image reference to calculate sizes */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            crossOrigin="anonymous"
            src={safeImageSrc}
            alt="Source for crop"
            onLoad={(e) => {
              const target = e.currentTarget;
              setImgNaturalSize({
                width: target.naturalWidth,
                height: target.naturalHeight
              });
            }}
            className="hidden"
          />

          {/* Interactive Transform Layer */}
          {imgNaturalSize.width > 0 && (
            <div
              className="absolute pointer-events-none transition-transform duration-75 ease-out"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                crossOrigin="anonymous"
                src={safeImageSrc}
                alt="Crop preview target"
                draggable={false}
                style={{
                  maxWidth: 'none',
                  maxHeight: 'none',
                  width: (() => {
                    const isRot = rotation === 90 || rotation === 270;
                    const effW = isRot ? imgNaturalSize.height : imgNaturalSize.width;
                    const effH = isRot ? imgNaturalSize.width : imgNaturalSize.height;
                    const baseScale = Math.max(cropBox.width / effW, cropBox.height / effH);
                    return Math.round(imgNaturalSize.width * baseScale);
                  })(),
                  height: (() => {
                    const isRot = rotation === 90 || rotation === 270;
                    const effW = isRot ? imgNaturalSize.height : imgNaturalSize.width;
                    const effH = isRot ? imgNaturalSize.width : imgNaturalSize.height;
                    const baseScale = Math.max(cropBox.width / effW, cropBox.height / effH);
                    return Math.round(imgNaturalSize.height * baseScale);
                  })()
                }}
                className="select-none"
              />
            </div>
          )}

          {/* Dark Mask Around Crop Window */}
          <div
            className="pointer-events-none absolute border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]"
            style={{
              width: cropBox.width,
              height: cropBox.height
            }}
          >
            {/* Rule of Thirds Grid Lines */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
              <div className="border-r border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div className="border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div className="border-b border-white/60" />
              <div className="border-r border-white/60" />
              <div className="border-r border-white/60" />
              <div />
            </div>

            {/* Corner Markers */}
            <div className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-white" />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-white" />
            <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-white" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-white" />
          </div>

          {/* Helper Hint Badge */}
          <div className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 bg-black/75 backdrop-blur-xs text-white px-2 sm:px-2.5 py-1 text-[10px] font-medium rounded-lg pointer-events-none flex items-center gap-1.5 border border-white/10 shadow-sm">
            <Maximize2 className="h-3 w-3 text-neutral-400 shrink-0" />
            <span className="hidden sm:inline">Klik &amp; tarik untuk memposisikan gambar</span>
            <span className="sm:hidden">Geser / cubit 2 jari</span>
          </div>
        </div>

        {/* Footer Toolbar Controls */}
        <div className="p-2.5 sm:p-3.5 bg-card border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 shrink-0">
          {/* Zoom Slider & Rotate */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-1.5 flex-1 sm:w-48">
              <ZoomOut className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                type="range"
                value={zoom}
                min={0.6}
                max={3}
                step={0.05}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <ZoomIn className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-mono font-bold w-8 text-muted-foreground text-right shrink-0">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-1 border-l border-border pl-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={rotate90}
                className="h-7.5 px-2 text-xs gap-1 rounded-lg cursor-pointer"
                title="Putar 90 derajat"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Putar</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetTransform}
                className="h-7.5 px-2 text-xs rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                title="Reset posisi & zoom"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex-1 sm:flex-none h-8.5 px-3.5 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApplyCrop}
              className="flex-1 sm:flex-none h-8.5 px-4 text-xs font-bold gap-1.5 rounded-xl bg-foreground text-background hover:bg-foreground/90 cursor-pointer shadow-xs"
            >
              <Check className="h-4 w-4" />
              <span>Terapkan Crop</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
