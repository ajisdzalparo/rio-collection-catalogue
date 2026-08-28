'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Home, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FadeIn, ScaleIn } from '@/components/ui/motion';
import { motion } from 'framer-motion';

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 text-foreground selection:bg-rose-500/20">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-125 w-125 -translate-x-1/2 rounded-full bg-linear-to-tr from-rose-500/20 via-amber-500/10 to-transparent blur-3xl opacity-70" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 h-125 w-125 rounded-full bg-linear-to-br from-red-600/15 via-rose-500/10 to-transparent blur-3xl opacity-60" />

      <div className="relative z-10 w-full max-w-lg space-y-8 text-center">
        <ScaleIn delay={0.1}>
          <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full border-2 border-rose-500/40 bg-rose-500/10"
            />
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/10 border border-rose-500/25 text-rose-500 shadow-xl backdrop-blur-xl">
              <ShieldAlert className="h-10 w-10 stroke-[2.2]" />
            </div>
          </div>
        </ScaleIn>

        <FadeIn delay={0.2} direction="up" className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 border border-rose-500/20 px-3.5 py-1 text-xs font-extrabold text-rose-500 tracking-wider uppercase">
            <KeyRound className="h-3 w-3" />
            Error 403 - Akses Ditolak
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground">
            Halaman Tidak Diizinkan
          </h1>
          <p className="mx-auto max-w-md text-sm sm:text-base font-medium text-muted-foreground leading-relaxed">
            Anda tidak memiliki hak akses atau izin yang cukup untuk membuka halaman ini. Silakan hubungi administrator jika ini kesalahan.
          </p>
        </FadeIn>

        <FadeIn delay={0.3} direction="up" className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="gap-2 rounded-2xl text-xs font-bold h-11 px-5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </Button>
          <Button
            render={<Link href="/dashboard" />}
            className="gap-2 rounded-2xl text-xs font-bold h-11 px-6 shadow-md bg-rose-600 hover:bg-rose-700 text-white border-0"
          >
            <Home className="h-4 w-4" />
            <span>Dashboard Utama</span>
          </Button>
        </FadeIn>
      </div>
    </div>
  );
}
