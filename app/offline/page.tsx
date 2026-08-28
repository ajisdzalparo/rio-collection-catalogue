'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WifiOff, RefreshCw, Home, CheckCircle2, HardDrive, Globe, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FadeIn, ScaleIn } from '@/components/ui/motion';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflinePage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = React.useState(false);
  const [progressValue, setProgressValue] = React.useState(0);
  const [statusText, setStatusText] = React.useState('Terputus dari Internet');

  const handleRetry = async () => {
    setIsChecking(true);
    setProgressValue(15);
    setStatusText('Memeriksa sinyal & ping jaringan...');

    const interval = setInterval(() => {
      setProgressValue((prev) => {
        if (prev >= 85) {
          clearInterval(interval);
          return prev;
        }
        return prev + 20;
      });
    }, 200);

    try {
      await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' });
      clearInterval(interval);
      setProgressValue(100);
      setStatusText('Koneksi terhubung! Mengalihkan ke dashboard...');
      setTimeout(() => router.push('/dashboard'), 800);
    } catch {
      clearInterval(interval);
      setProgressValue(100);
      setStatusText('Masih terputus dari jaringan internet.');
    } finally {
      setTimeout(() => {
        setIsChecking(false);
        setProgressValue(0);
      }, 1000);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 text-foreground">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-125 w-125 -translate-x-1/2 rounded-full bg-linear-to-tr from-amber-500/15 via-rose-500/10 to-transparent blur-3xl opacity-60" />

      <div className="relative z-10 w-full max-w-lg space-y-8 text-center">
        <ScaleIn delay={0.1}>
          <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full border-2 border-amber-500/40 bg-amber-500/10"
            />
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-500 shadow-xl backdrop-blur-xl">
              <WifiOff className="h-10 w-10 stroke-[2.2]" />
            </div>
          </div>
        </ScaleIn>

        <FadeIn delay={0.2} direction="up" className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3.5 py-1 text-xs font-extrabold text-amber-500 tracking-wider uppercase">
            <Radio className="h-3 w-3 animate-pulse" />
            Anda Sedang Offline
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Tidak Ada Koneksi Internet
          </h1>
          <p className="mx-auto max-w-sm text-sm font-medium text-muted-foreground leading-relaxed">
            {statusText}
          </p>

          <AnimatePresence>
            {isChecking && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2 px-6"
              >
                <Progress
                  value={progressValue}
                  variant="amber"
                  size="sm"
                  showValue
                  label="Pemeriksaan Koneksi"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </FadeIn>

        <FadeIn
          delay={0.3}
          direction="up"
          className="space-y-3 text-left p-5 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md shadow-xs"
        >
          <span className="text-xs font-bold text-foreground uppercase tracking-wider text-[11px] block text-center sm:text-left">
            Informasi Mode Offline
          </span>
          <div className="space-y-2.5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-muted-foreground">
                Halaman dan data yang tersimpan di cache tetap dapat diakses.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <HardDrive className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-muted-foreground">
                Perubahan formulir akan disimpan sementara secara lokal.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-muted-foreground">
                Sinkronisasi otomatis akan berjalan begitu koneksi pulih.
              </p>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.4} direction="up" className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            disabled={isChecking}
            onClick={handleRetry}
            className="gap-2 rounded-2xl text-xs font-bold h-11 px-5"
          >
            <RefreshCw className={cn('h-4 w-4', isChecking && 'animate-spin')} />
            <span>{isChecking ? 'Pemeriksaan...' : 'Coba Hubungkan Ulang'}</span>
          </Button>

          <Button
            render={<Link href="/dashboard" />}
            className="gap-2 rounded-2xl text-xs font-bold h-11 px-5 shadow-md"
          >
            <Home className="h-4 w-4" />
            <span>Ke Dashboard</span>
          </Button>
        </FadeIn>
      </div>
    </div>
  );
}
