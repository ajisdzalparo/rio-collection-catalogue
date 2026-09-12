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
  title = 'Konfirmasi Hapus Data',
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
      <DialogContent className="w-full sm:max-w-md bg-card border border-border/60 text-foreground p-6 sm:p-7 rounded-2xl shadow-xl gap-0 overflow-hidden">
        <DialogHeader className="gap-0 flex flex-col items-center text-center space-y-0">
          {/* Alert Icon Badge */}
          <div
            className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border mx-auto shadow-2xs',
              variant === 'destructive'
                ? 'bg-destructive/10 text-destructive border-destructive/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
            )}
          >
            <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
          </div>

          {/* Title & Description */}
          <div className="mt-4 space-y-2 text-center">
            <DialogTitle className="text-lg font-bold tracking-tight text-foreground leading-tight">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium leading-relaxed">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Bottom Action Buttons: Full Width & Justify Between */}
        <div className="mt-7 flex items-center justify-between gap-3 w-full">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
            className="w-full flex-1 h-10 px-4 rounded-xl text-xs font-bold text-foreground bg-muted/60 hover:bg-muted border border-border/40 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            disabled={isBusy}
            className={cn(
              'w-full flex-1 h-10 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center',
              variant === 'destructive'
                ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
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
