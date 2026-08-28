'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Compass, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FadeIn, ScaleIn } from '@/components/ui/motion';
import { motion } from 'framer-motion';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 text-foreground selection:bg-primary/20">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-125 w-125 -translate-x-1/2 rounded-full bg-linear-to-tr from-primary/20 via-purple-500/10 to-transparent blur-3xl opacity-70" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 h-125 w-125 rounded-full bg-linear-to-br from-indigo-500/15 via-primary/10 to-transparent blur-3xl opacity-60" />

      <div className="relative z-10 w-full max-w-lg space-y-8 text-center">
        <ScaleIn delay={0.1}>
          <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
            />
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20 text-primary shadow-xl backdrop-blur-xl">
              <Compass className="h-10 w-10 stroke-[2.2]" />
            </div>
          </div>
        </ScaleIn>

        <FadeIn delay={0.2} direction="up" className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-extrabold text-primary tracking-wider uppercase">
            Error 404
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground">
            Halaman Tidak Ditemukan
          </h1>
          <p className="mx-auto max-w-md text-sm sm:text-base font-medium text-muted-foreground leading-relaxed">
            Halaman yang Anda cari tidak tersedia, telah dipindahkan, atau alamat URL yang Anda tuju
            kurang tepat.
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
            className="gap-2 rounded-2xl text-xs font-bold h-11 px-6 shadow-md"
          >
            <Home className="h-4 w-4" />
            <span>Dashboard Utama</span>
          </Button>
        </FadeIn>
      </div>
    </div>
  );
}
