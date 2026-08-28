'use client';

import * as React from 'react';
import { WifiOff, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

function useOnlineStatus() {
  return React.useSyncExternalStore(
    (callback) => {
      window.addEventListener('online', callback);
      window.addEventListener('offline', callback);
      return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
      };
    },
    () => navigator.onLine,
    () => true
  );
}

export function OfflineDetector() {
  const isOnline = useOnlineStatus();
  const [isChecking, setIsChecking] = React.useState<boolean>(false);
  const [showReconnected, setShowReconnected] = React.useState<boolean>(false);
  const prevIsOnline = React.useRef(isOnline);

  React.useEffect(() => {
    if (!prevIsOnline.current && isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 4000);
      return () => clearTimeout(timer);
    }
    prevIsOnline.current = isOnline;
  }, [isOnline]);

  const isOffline = !isOnline;

  const handleRetry = async () => {
    setIsChecking(true);
    try {
      await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' });
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 4000);
    } catch {
      // Still offline
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="fixed top-4 left-1/2 z-100 -translate-x-1/2 w-[92%] max-w-md rounded-2xl border border-destructive/30 bg-card/95 p-3.5 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <WifiOff className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                  Mode Offline <ShieldAlert className="h-3 w-3 text-destructive" />
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  Koneksi internet terputus. Memuat data lokal.
                </span>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              disabled={isChecking}
              onClick={handleRetry}
              className="h-8 rounded-xl px-2.5 text-xs font-bold shrink-0 gap-1.5"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isChecking && 'animate-spin')} />
              <span>{isChecking ? 'Cek...' : 'Coba Lagi'}</span>
            </Button>
          </div>
        </motion.div>
      )}

      {showReconnected && !isOffline && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="fixed top-4 left-1/2 z-100 -translate-x-1/2 w-[92%] max-w-md rounded-2xl border border-emerald-500/30 bg-card/95 p-3.5 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-extrabold text-foreground">Koneksi Terhubung</span>
              <span className="text-[11px] font-medium text-muted-foreground">
                Internet Anda telah kembali online.
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
