'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isEnded: boolean;
}

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function calculateTimeLeft(targetDate: string | Date): TimeLeft {
  const target = new Date(targetDate).getTime();
  const now = new Date().getTime();
  const diff = target - now;

  if (isNaN(target) || diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, isEnded: false };
}

interface CountdownTimerProps {
  targetDate: string | Date;
  variant?: 'compact' | 'detail' | 'hero' | 'inline';
  className?: string;
  onEnded?: () => void;
}

export function CountdownTimer({
  targetDate,
  variant = 'compact',
  className,
  onEnded
}: CountdownTimerProps) {
  const isClient = useIsClient();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft(targetDate);
      setTimeLeft(remaining);
      if (remaining.isEnded) {
        clearInterval(interval);
        onEnded?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onEnded]);

  // Format double digits
  const pad = (n: number) => String(n).padStart(2, '0');

  if (!isClient) {
    return (
      <div className={cn('animate-pulse opacity-50', className)}>
        {variant === 'compact' && <span className="text-[11px] font-mono">--:--:--</span>}
        {variant === 'detail' && (
          <div className="h-16 bg-(--cat-surface-container-low) rounded-none border border-(--cat-stone)" />
        )}
      </div>
    );
  }

  if (timeLeft.isEnded) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 font-hanken text-[11px] font-semibold text-emerald-600 dark:text-emerald-400',
          className
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span>Telah Rilis Sekarang</span>
      </div>
    );
  }

  // ═══ Compact Variant (For Product Cards & Badges) ═══
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 bg-(--cat-surface)/90 backdrop-blur-xs border border-(--cat-stone) text-(--cat-on-surface) font-mono text-[11px] font-medium tracking-tight shadow-xs',
          className
        )}
      >
        <Clock className="h-3 w-3 text-amber-500 shrink-0" />
        <span>
          {timeLeft.days > 0 ? `${timeLeft.days}h ` : ''}
          {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
        </span>
      </div>
    );
  }

  // ═══ Inline Variant (Single line minimal) ═══
  if (variant === 'inline') {
    return (
      <div className={cn('inline-flex items-center gap-1 font-mono text-[12px]', className)}>
        <span className="font-semibold text-(--cat-on-surface)">
          {timeLeft.days > 0 && `${timeLeft.days} hari `}
          {pad(timeLeft.hours)}j {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s
        </span>
      </div>
    );
  }

  // ═══ Hero Variant (High visual contrast for Hero Banners) ═══
  if (variant === 'hero') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 border-y border-white/20 bg-black/45 px-3 py-2 text-center text-white backdrop-blur-sm',
          className
        )}
      >
        <div className="flex items-center gap-1.5">
          <div className="flex min-w-10 flex-col items-center px-1.5 py-0.5">
            <span className="font-mono text-[16px] font-bold leading-tight">
              {pad(timeLeft.days)}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-white/70">Hari</span>
          </div>
          <span className="pb-3 font-bold text-white/40">:</span>
          <div className="flex min-w-10 flex-col items-center px-1.5 py-0.5">
            <span className="font-mono text-[16px] font-bold leading-tight">
              {pad(timeLeft.hours)}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-white/70">Jam</span>
          </div>
          <span className="pb-3 font-bold text-white/40">:</span>
          <div className="flex min-w-10 flex-col items-center px-1.5 py-0.5">
            <span className="font-mono text-[16px] font-bold leading-tight">
              {pad(timeLeft.minutes)}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-white/70">Mnt</span>
          </div>
          <span className="pb-3 font-bold text-white/40">:</span>
          <div className="flex min-w-10 flex-col items-center px-1.5 py-0.5">
            <span className="font-mono text-[16px] font-bold leading-tight text-amber-300">
              {pad(timeLeft.seconds)}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-white/70">Dtk</span>
          </div>
        </div>
      </div>
    );
  }

  // ═══ Detail Variant (Product Detail Page Box) ═══
  const formattedDate = new Date(targetDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div
      className={cn(
        'p-4 bg-(--cat-surface-container-low) border border-(--cat-stone) space-y-3',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span className="font-hanken text-[11px] uppercase tracking-widest font-semibold text-(--cat-on-surface)">
            Peluncuran Segera Hadir
          </span>
        </div>
        <span className="text-[11px] font-hanken text-(--cat-on-surface-variant)">
          {formattedDate}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-1">
        <div className="flex flex-col items-center justify-center p-2.5 bg-(--cat-surface) border border-(--cat-stone)">
          <span className="font-mono text-[20px] md:text-[24px] font-semibold text-(--cat-on-surface) leading-none">
            {pad(timeLeft.days)}
          </span>
          <span className="font-hanken text-[10px] uppercase tracking-wider text-(--cat-on-surface-variant) mt-1">
            Hari
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-2.5 bg-(--cat-surface) border border-(--cat-stone)">
          <span className="font-mono text-[20px] md:text-[24px] font-semibold text-(--cat-on-surface) leading-none">
            {pad(timeLeft.hours)}
          </span>
          <span className="font-hanken text-[10px] uppercase tracking-wider text-(--cat-on-surface-variant) mt-1">
            Jam
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-2.5 bg-(--cat-surface) border border-(--cat-stone)">
          <span className="font-mono text-[20px] md:text-[24px] font-semibold text-(--cat-on-surface) leading-none">
            {pad(timeLeft.minutes)}
          </span>
          <span className="font-hanken text-[10px] uppercase tracking-wider text-(--cat-on-surface-variant) mt-1">
            Menit
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-2.5 bg-(--cat-surface) border border-(--cat-stone)">
          <span className="font-mono text-[20px] md:text-[24px] font-semibold text-amber-600 dark:text-amber-400 leading-none">
            {pad(timeLeft.seconds)}
          </span>
          <span className="font-hanken text-[10px] uppercase tracking-wider text-(--cat-on-surface-variant) mt-1">
            Detik
          </span>
        </div>
      </div>
    </div>
  );
}
