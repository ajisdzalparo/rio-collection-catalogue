'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, X, Crop, Image as ImageIcon, Link as LinkIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ImageCropperModal, AspectRatioOption } from '@/components/shared/image-cropper-modal';
import { withActionLoading } from '@/hooks/use-action-loading';

export interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  aspectRatio?: AspectRatioOption;
  helperText?: string;
}

function getAspectRatioClass(ratio?: AspectRatioOption): string {
  switch (ratio) {
    case '1:1':
      return 'aspect-square max-w-sm mx-auto';
    case '3:4':
      return 'aspect-3/4 max-w-sm mx-auto';
    case '4:5':
      return 'aspect-4/5 max-w-sm mx-auto';
    case '16:9':
      return 'aspect-video w-full';
    case '9:16':
      return 'aspect-9/16 max-w-xs mx-auto';
    default:
      return 'aspect-video w-full';
  }
}

export function ImageUpload({
  value = '',
  onChange,
  placeholder = 'Pilih gambar atau drop file di sini',
  className,
  aspectRatio = '3:4',
  helperText
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputVal, setUrlInputVal] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Cropper Modal States
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [rawImageForCrop, setRawImageForCrop] = useState<string>('');

  // Upload cropped file to API or fallback to data URL
  const uploadFile = async (file: File, fallbackPreviewUrl?: string) => {
    setIsUploading(true);
    try {
      await withActionLoading(async () => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/v1/upload', {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data?.url) {
            onChange(json.data.url);
            setIsUploading(false);
            return;
          }
        }
      }, 'Mengunggah gambar...');
    } catch (error) {
      console.warn('Upload API unavailable, using local cropped data URL:', error);
    }

    // If previewUrl is already a permanent base64 data URL, use it directly
    if (fallbackPreviewUrl && !fallbackPreviewUrl.startsWith('blob:')) {
      onChange(fallbackPreviewUrl);
      setIsUploading(false);
      return;
    }

    // Otherwise convert the cropped File to a permanent base64 data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChange(e.target.result as string);
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      if (fallbackPreviewUrl) {
        onChange(fallbackPreviewUrl);
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // When a user selects a file from disk, open the cropper first
  const handleFilePicked = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (JPEG, PNG, WEBP, dll.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setRawImageForCrop(e.target.result as string);
        setIsCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedFile: File, previewUrl: string) => {
    uploadFile(croppedFile, previewUrl);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFilePicked(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFilePicked(e.target.files[0]);
    }
    // reset input so same file can be picked again if desired
    e.target.value = '';
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInputVal.trim()) {
      onChange(urlInputVal.trim());
      setShowUrlInput(false);
      setUrlInputVal('');
    }
  };

  const clearImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange('');
  };

  const openRecrop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (value) {
      setRawImageForCrop(value);
      setIsCropperOpen(true);
    }
  };

  const hasImage = !!value;
  const aspectClass = getAspectRatioClass(aspectRatio);

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {hasImage ? (
        // Preview State
        <div
          className={cn(
            'relative w-full overflow-hidden rounded-2xl border border-border/60 bg-muted/20 group transition-all',
            aspectClass
          )}
        >
          {isUploading && (
            <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs font-semibold">Mengunggah foto terpotong...</span>
            </div>
          )}

          <Image
            width={600}
            height={800}
            src={value}
            alt="Uploaded preview"
            unoptimized
            className="h-full w-full object-cover transition-transform duration-350 group-hover:scale-102"
          />

          {/* Desktop Action Overlay (Hover) */}
          <div className="hidden sm:flex absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 items-center justify-center gap-2 p-3">
            <button
              type="button"
              onClick={openRecrop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black text-xs font-bold shadow-md hover:bg-gray-100 hover:scale-105 transition-all cursor-pointer"
              title="Crop & Atur Posisi Foto"
            >
              <Crop className="h-3.5 w-3.5" />
              <span>Crop Ulang</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 text-white text-xs font-bold shadow-md hover:bg-neutral-800 hover:scale-105 transition-all cursor-pointer border border-white/20"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Ganti</span>
            </button>

            <button
              type="button"
              onClick={clearImage}
              className="p-2 rounded-xl bg-destructive text-destructive-foreground hover:scale-105 transition-transform cursor-pointer shadow-md"
              title="Hapus Gambar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile Action Bar (Always visible on touch screens) */}
          <div className="sm:hidden absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1.5 p-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 shadow-lg">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={openRecrop}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-black text-[11px] font-bold shadow active:scale-95 transition-transform"
                title="Crop & Atur Posisi Foto"
              >
                <Crop className="h-3 w-3" />
                <span>Crop</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 text-white text-[11px] font-bold shadow active:scale-95 transition-transform border border-white/20"
              >
                <Upload className="h-3 w-3" />
                <span>Ganti</span>
              </button>
            </div>

            <button
              type="button"
              onClick={clearImage}
              className="p-1.5 rounded-lg bg-destructive text-destructive-foreground active:scale-95 transition-transform shadow"
              title="Hapus Gambar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        // Upload/Drop Zone
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => {
            if (!showUrlInput && !isUploading) fileInputRef.current?.click();
          }}
          className={cn(
            'flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed border-border/70 bg-muted/10 transition-all duration-200 cursor-pointer select-none px-4 text-center',
            aspectClass,
            isDragActive
              ? 'border-primary bg-primary/5 scale-[0.99]'
              : 'hover:border-foreground/40 hover:bg-muted/20'
          )}
        >

          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs font-semibold text-foreground">
                Memproses &amp; Mengunggah...
              </span>
            </div>
          ) : showUrlInput ? (
            <form
              onSubmit={handleUrlSubmit}
              className="w-full max-w-xs space-y-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1.5">
                <Input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={urlInputVal}
                  onChange={(e) => setUrlInputVal(e.target.value)}
                  className="h-8 text-xs rounded-xl flex-1 bg-card"
                  autoFocus
                />
                <button
                  type="submit"
                  className="h-8 px-3 text-xs font-bold bg-foreground text-background rounded-xl hover:opacity-90 cursor-pointer"
                >
                  Ok
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowUrlInput(false)}
                className="text-[10px] text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
              >
                Kembali ke Upload File
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-2xl bg-card border border-border/40 text-muted-foreground shadow-3xs group-hover:text-foreground group-hover:border-border transition-colors">
                <Upload className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">{placeholder}</p>
                <p className="text-[10px] text-muted-foreground">
                  Otomatis membuka crop rasio{' '}
                  <span className="font-semibold text-foreground">
                    {typeof aspectRatio === 'string' ? aspectRatio : 'Presisi'}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUrlInput(true);
                }}
                className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-muted-foreground hover:text-foreground bg-card border border-border/40 px-2.5 py-1 rounded-lg shadow-3xs cursor-pointer"
              >
                <LinkIcon className="h-3 w-3" />
                <span>Atau paste URL web</span>
              </button>
            </div>
          )}
        </div>
      )}

      {helperText && (
        <p className="text-[10px] text-muted-foreground text-center sm:text-left">{helperText}</p>
      )}

      {/* Interactive Crop Modal */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        imageSrc={rawImageForCrop}
        onClose={() => setIsCropperOpen(false)}
        onCropComplete={handleCropComplete}
        defaultAspectRatio={aspectRatio}
        title={`Crop Foto (${typeof aspectRatio === 'string' ? aspectRatio : 'Sesuai Container'})`}
      />
    </div>
  );
}

export interface MultiImageUploadProps {
  value: string[]; // List of URLs or base64 strings
  onChange: (value: string[]) => void;
  maxImages?: number;
  slotLabels?: string[];
  aspectRatio?: AspectRatioOption;
}

export function MultiImageUpload({
  value = [],
  onChange,
  maxImages = 6,
  slotLabels = [],
  aspectRatio = '1:1'
}: MultiImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  const [currentCropImage, setCurrentCropImage] = useState<string>('');
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [activeEditingIndex, setActiveEditingIndex] = useState<number | null>(null);

  // Process next file in queue
  const processNextInQueue = (remainingQueue: File[]) => {
    if (remainingQueue.length === 0) {
      setIsCropperOpen(false);
      setCurrentCropImage('');
      return;
    }

    const nextFile = remainingQueue[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCurrentCropImage(e.target.result as string);
        setIsCropperOpen(true);
      }
    };
    reader.readAsDataURL(nextFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const availableSlots = maxImages - value.length;
      const selectedFiles = Array.from(e.target.files).slice(0, availableSlots);

      if (selectedFiles.length > 0) {
        setFileQueue(selectedFiles);
        processNextInQueue(selectedFiles);
      }
    }
    e.target.value = '';
  };

  const handleCropComplete = async (croppedFile: File, previewUrl: string) => {
    if (activeEditingIndex !== null) {
      // Re-cropping an existing item
      const updated = [...value];
      updated[activeEditingIndex] = previewUrl;
      onChange(updated);
      setActiveEditingIndex(null);
      setIsCropperOpen(false);
      return;
    }

    // Adding new item
    let finalUrl = previewUrl;
    try {
      await withActionLoading(async () => {
        const formData = new FormData();
        formData.append('file', croppedFile);
        const res = await fetch('/api/v1/upload', {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data?.url) {
            finalUrl = json.data.url;
          }
        }
      }, 'Mengunggah gambar...');
    } catch {
      // fallback to previewUrl
    }

    onChange([...value, finalUrl]);

    // Check if more files in queue
    const remaining = fileQueue.slice(1);
    setFileQueue(remaining);
    processNextInQueue(remaining);
  };

  const removeImage = (indexToRemove: number) => {
    onChange(value.filter((_, idx) => idx !== indexToRemove));
  };

  const openRecropItem = (imgUrl: string, idx: number) => {
    setActiveEditingIndex(idx);
    setCurrentCropImage(imgUrl);
    setIsCropperOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {value.map((img, idx) => (
          <div
            key={idx}
            className="relative aspect-square w-full overflow-hidden rounded-xl border border-border/50 bg-muted/20 group"
          >
            {slotLabels[idx] && (
              <span className="absolute top-1 left-1 z-10 rounded-md bg-black/70 px-1.5 py-1 text-[9px] font-bold text-white">
                {slotLabels[idx]}
              </span>
            )}
            <Image
              fill
              src={img}
              alt={`Gallery preview ${idx}`}
              className="object-cover transition-transform duration-200 group-hover:scale-103"
              unoptimized
            />

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => openRecropItem(img, idx)}
                className="p-1.5 rounded-lg bg-white text-black hover:scale-105 transition-transform cursor-pointer shadow-sm"
                title="Crop Foto Ini"
              >
                <Crop className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="p-1.5 rounded-lg bg-destructive text-destructive-foreground hover:scale-105 transition-transform cursor-pointer shadow-sm"
                title="Hapus Gambar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        {value.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center aspect-square w-full rounded-xl border border-dashed border-border/70 hover:border-foreground/40 bg-muted/10 hover:bg-muted/20 transition-all cursor-pointer"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <ImageIcon className="h-5 w-5 text-muted-foreground mb-1" />
            <span className="text-[10px] font-bold text-muted-foreground">Tambah Foto</span>
          </button>
        )}
      </div>

      <div className="text-[9px] font-medium text-muted-foreground">
        Foto otomatis dipotong sesuai rasio{' '}
        <span className="font-semibold text-foreground">
          {typeof aspectRatio === 'string' ? aspectRatio : 'Persegi 1:1'}
        </span>
        . {value.length} / {maxImages} foto.
      </div>

      <ImageCropperModal
        isOpen={isCropperOpen}
        imageSrc={currentCropImage}
        onClose={() => {
          setIsCropperOpen(false);
          setActiveEditingIndex(null);
          setFileQueue([]);
        }}
        onCropComplete={handleCropComplete}
        defaultAspectRatio={aspectRatio}
        title="Crop Foto Galeri Detail"
      />
    </div>
  );
}
