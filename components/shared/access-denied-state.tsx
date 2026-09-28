'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AccessDeniedStateProps {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}

export function AccessDeniedState({
  title = 'Akses Terbatas',
  description = 'Role akun Anda tidak memiliki izin untuk mengakses halaman atau fitur ini. Silakan hubungi Super Admin untuk penyesuaian hak akses.',
  backHref = '/dashboard',
  backLabel = 'Kembali ke Dashboard'
}: AccessDeniedStateProps) {
  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="h-16 w-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <div className="space-y-1.5 max-w-md">
        <h2 className="text-xl font-extrabold text-foreground tracking-tight">{title}</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <Link href={backHref}>
        <Button className="rounded-xl font-bold text-xs gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>{backLabel}</span>
        </Button>
      </Link>
    </div>
  );
}
