'use client';

import { useRef, useState } from 'react';
import { CheckCircle2, FileText, Loader2, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PaymentProofUploadProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  description?: string;
  required?: boolean;
}

export function PaymentProofUpload({
  value,
  onChange,
  label,
  description = 'JPG, PNG, WebP atau PDF (maks. 10 MB)',
  required = true
}: PaymentProofUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileName = value ? value.split('/').pop() || 'Bukti berhasil diunggah' : '';

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Format bukti harus JPG, PNG, WebP, atau PDF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Ukuran file maksimal 10 MB.');
      return;
    }

    setError('');
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', 'payment-proof');
      const response = await fetch('/api/v1/upload', { method: 'POST', body: formData });
      const result = (await response.json()) as { data?: { url?: string }; message?: string };
      if (!response.ok || !result.data?.url) {
        throw new Error(result.message || 'Upload bukti gagal.');
      }
      onChange(result.data.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload bukti gagal.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleFileChange}
        aria-label={label}
      />
      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3">
          <div className="flex min-w-0 items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-foreground">{fileName}</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Bukti siap disimpan</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={isUploading}>
              Ganti
            </Button>
            <Button type="button" variant="ghost" size="icon-xs" onClick={() => onChange('')} aria-label={`Hapus ${label}`}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className={cn('flex w-full items-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/10 p-3 text-left transition-colors hover:border-foreground/40 hover:bg-muted/25 disabled:cursor-not-allowed disabled:opacity-60')}
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
          <span className="min-w-0">
            <span className="block text-xs font-bold text-foreground">{isUploading ? 'Mengunggah bukti...' : 'Upload bukti pembayaran'}</span>
            <span className="block text-[10px] text-muted-foreground">{description}</span>
          </span>
          <FileText className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/60" />
        </button>
      )}
      {error ? <p className="text-[10px] font-semibold text-red-500">{error}</p> : null}
    </div>
  );
}
