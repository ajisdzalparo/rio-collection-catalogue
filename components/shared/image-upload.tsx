'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface ImageUploadProps {
  value?: string; // Can be a URL or base64 string
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function ImageUpload({
  value = '',
  onChange,
  placeholder = 'Pilih gambar atau drop file di sini',
  className
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputVal, setUrlInputVal] = useState('');

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (JPEG, PNG, WEBP, dll.)');
      return;
    }

    try {
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
          return;
        }
      }
    } catch (error) {
      console.error('Failed to upload file to MinIO:', error);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChange(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
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
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
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

  const hasImage = !!value;

  return (
    <div className={cn('w-full space-y-2', className)}>
      {hasImage ? (
        // Preview State
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/50 bg-muted/20 group">
          <img
            src={value}
            alt="Uploaded preview"
            className="h-full w-full object-cover transition-transform duration-350 group-hover:scale-103"
          />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl bg-white text-black text-xs font-bold shadow-sm hover:scale-105 transition-transform cursor-pointer"
            >
              Ganti File
            </button>
            <button
              type="button"
              onClick={clearImage}
              className="p-1.5 rounded-xl bg-destructive text-destructive-foreground hover:scale-105 transition-transform cursor-pointer"
              title="Hapus Gambar"
            >
              <X className="h-4 w-4" />
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
            if (!showUrlInput) fileInputRef.current?.click();
          }}
          className={cn(
            'flex flex-col items-center justify-center aspect-video w-full rounded-2xl border-2 border-dashed border-border/60 bg-muted/10 transition-all duration-200 cursor-pointer select-none px-4 text-center',
            isDragActive
              ? 'border-foreground/50 bg-muted/30 scale-[0.99]'
              : 'hover:border-foreground/30 hover:bg-muted/20'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {showUrlInput ? (
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
                  className="h-8 px-3 text-xs font-bold bg-foreground text-background rounded-xl hover:opacity-90"
                >
                  Ok
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowUrlInput(false)}
                className="text-[10px] text-muted-foreground hover:text-foreground font-semibold"
              >
                Kembali ke Upload File
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-2.5 rounded-xl bg-card border border-border/40 text-muted-foreground shadow-3xs">
                <Upload className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">{placeholder}</p>
                <p className="text-[10px] text-muted-foreground">
                  PNG, JPG, WebP atau SVG (Max 5MB)
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUrlInput(true);
                }}
                className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-muted-foreground hover:text-foreground bg-card border border-border/40 px-2 py-1 rounded-lg"
              >
                <LinkIcon className="h-3 w-3" />
                <span>Atau paste URL web</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface MultiImageUploadProps {
  value: string[]; // List of URLs or base64 strings
  onChange: (value: string[]) => void;
  maxImages?: number;
}

export function MultiImageUpload({ value = [], onChange, maxImages = 6 }: MultiImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChange([...value, e.target.result as string]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files)
        .slice(0, maxImages - value.length)
        .forEach(handleFile);
    }
  };

  const removeImage = (indexToRemove: number) => {
    onChange(value.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {value.map((img, idx) => (
          <div
            key={idx}
            className="relative aspect-square w-full overflow-hidden rounded-xl border border-border/40 bg-muted/20 group"
          >
            <img
              src={img}
              alt={`Gallery preview ${idx}`}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-103"
            />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute top-1 right-1 p-1 rounded-lg bg-black/60 text-white hover:bg-destructive transition-colors cursor-pointer"
              title="Hapus Gambar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {value.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center aspect-square w-full rounded-xl border border-dashed border-border/60 hover:border-foreground/30 bg-muted/10 hover:bg-muted/20 transition-all cursor-pointer"
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
        Ukuran galeri: {value.length} / {maxImages} foto. Format JPEG, PNG, WebP.
      </div>
    </div>
  );
}
