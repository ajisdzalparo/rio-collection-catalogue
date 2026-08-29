'use client';

import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'default';
  onConfirm: () => void;
  loading?: boolean;
  isLoading?: boolean;
}

export function ConfirmModal({
  open,
  onOpenChange,
  title = 'Konfirmasi Hapus Data Master',
  description = 'Apakah Anda yakin ingin menghapus data ini?',
  confirmText = 'Hapus',
  cancelText = 'Batal',
  variant = 'destructive',
  onConfirm,
  loading = false,
  isLoading = false
}: ConfirmModalProps) {
  const isBusy = loading || isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-107.5 bg-[#121214] border-[#27272a] text-white p-7 rounded-[24px] shadow-2xl shadow-black/90 gap-0 overflow-hidden">
        <DialogHeader className="gap-0 flex flex-col items-center text-center space-y-0">
          {/* Alert Icon Badge */}
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center shrink-0 border mx-auto',
              variant === 'destructive'
                ? 'bg-[#ef4444]/15 text-[#f87171] border-[#ef4444]/25'
                : 'bg-primary/15 text-primary border-primary/25'
            )}
          >
            <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
          </div>

          {/* Title & Description */}
          <div className="mt-5 space-y-2 text-center">
            <DialogTitle className="text-xl font-bold tracking-tight text-white leading-tight">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#a1a1aa] font-medium leading-relaxed">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Bottom Action Buttons */}
        <div className="mt-8 flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
            className="h-10 px-6 rounded-full text-xs font-bold text-white bg-[#27272a] hover:bg-[#3f3f46] transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            disabled={isBusy}
            className={cn(
              'h-10 px-7 rounded-full text-xs font-extrabold text-white transition-all cursor-pointer shadow-md disabled:opacity-50',
              variant === 'destructive'
                ? 'bg-[#f87171] hover:bg-[#ef4444] shadow-rose-950/50'
                : 'bg-foreground hover:bg-foreground/90 text-background'
            )}
          >
            {isBusy ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Memproses...</span>
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
