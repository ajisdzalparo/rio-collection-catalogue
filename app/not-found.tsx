'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Compass, ArrowLeft, Home, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FadeIn, ScaleIn } from '@/components/ui/motion';
import { motion } from 'framer-motion';

export default function NotFound() {
  const router = useRouter();
  const pathname = usePathname();

  // Detect if the user is attempting to access a dashboard path
  const isDashboardPath =
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/users');

  if (!isDashboardPath) {
    // Return a beautiful, minimalist, design-system aligned Catalogue 404 page
    return (
      <div
        className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-(--cat-surface) px-4 py-12 text-(--cat-on-surface) selection:bg-(--cat-stone)/50"
        data-catalogue
      >
        <div className="pointer-events-none absolute -top-40 left-1/2 h-125 w-125 -translate-x-1/2 rounded-full bg-linear-to-tr from-(--cat-stone)/20 via-neutral-100/10 to-transparent blur-3xl opacity-70" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-125 w-125 rounded-full bg-linear-to-br from-neutral-200/20 via-(--cat-stone)/15 to-transparent blur-3xl opacity-60" />

        <div className="relative z-10 w-full max-w-lg space-y-8 text-center">
          <ScaleIn delay={0.1}>
            <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-(--cat-stone)/40"
              />
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-(--cat-surface-container-low) border border-(--cat-stone)/60 text-(--cat-on-surface) shadow-xl backdrop-blur-xl">
                <Compass className="h-10 w-10 stroke-[2.2]" />
              </div>
            </div>
          </ScaleIn>

          <FadeIn delay={0.2} direction="up" className="space-y-4">
            <div className="inline-flex items-center gap-2 border border-(--cat-stone) px-4 py-1 text-[11px] font-semibold text-(--cat-on-surface-variant) uppercase tracking-[0.08em] bg-(--cat-surface-container-low)">
              Error 404
            </div>
            <h1 className="font-eb-garamond text-[36px] md:text-[48px] font-normal leading-tight text-(--cat-on-surface)">
              Halaman Tidak Ditemukan
            </h1>
            <p className="mx-auto max-w-md font-hanken text-[14px] leading-relaxed text-(--cat-on-surface-variant)">
              Halaman yang Anda cari tidak tersedia, telah dipindahkan, atau alamat URL yang Anda
              tuju kurang tepat.
            </p>
          </FadeIn>

          <FadeIn
            delay={0.3}
            direction="up"
            className="flex items-center justify-center gap-3 pt-2"
          >
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 border border-(--cat-stone) bg-(--cat-surface) text-(--cat-on-surface) px-6 py-2.5 font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] hover:bg-(--cat-surface-container) transition-colors duration-150 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
              <span>Kembali</span>
            </button>
            <Link
              href="/catalogue"
              className="inline-flex items-center gap-2 bg-(--cat-charcoal) text-white px-6 py-2.5 font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] hover:opacity-85 transition-opacity duration-150"
            >
              <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
              <span>Ke Katalog</span>
            </Link>
          </FadeIn>
        </div>
      </div>
    );
  }

  // Dashboard 404 page (original styling)
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
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-xl backdrop-blur-xl">
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
