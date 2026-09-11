'use client';

import React, { useEffect } from 'react';
import { useIsMutating } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useActionLoadingStore, setupAxiosLoadingInterceptors } from '@/hooks/use-action-loading';

export function ActionLoadingOverlay() {
  useEffect(() => {
    setupAxiosLoadingInterceptors();
  }, []);

  const isMutating = useIsMutating({
    predicate: (mutation) => {
      // Ignore background cron or read-like mutations if any
      const mutationKey = mutation.options.mutationKey;
      if (Array.isArray(mutationKey) && mutationKey.includes('skip-overlay')) return false;
      return true;
    }
  });

  const activeCount = useActionLoadingStore((s) => s.activeCount);
  const message = useActionLoadingStore((s) => s.message);

  const isVisible = activeCount > 0 || isMutating > 0;

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Sedang memproses permintaan..."
      className="fixed inset-0 z-99999 flex items-center justify-center bg-black/70 backdrop-blur-xs select-none animate-in fade-in-0 duration-200"
    >
      <div className="relative bg-card/95 border border-border/60 rounded-xl px-8 py-6 shadow-2xl flex flex-col items-center gap-3.5 max-w-sm text-center mx-4 animate-in zoom-in-95 duration-200">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-3 border-primary/25 animate-spin border-t-primary" />
          <Loader2 className="absolute h-5 w-5 text-primary animate-pulse" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-bold text-foreground tracking-wide">
            {message || 'Memproses Perubahan...'}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Mohon tunggu sebentar, permintaan Anda sedang diproses.
          </p>
        </div>
      </div>
    </div>
  );
}
