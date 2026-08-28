import * as React from 'react';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { EB_Garamond, Hanken_Grotesk } from 'next/font/google';
import AppProvider from '@/providers/app-provider';
import { Toaster } from '@/components/ui/sonner';
import { OfflineDetector } from '@/components/shared/offline-detector';
import { TopLoader } from '@/components/shared/top-loader';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
});

const ebGaramond = EB_Garamond({
  variable: '--font-catalogue-serif',
  subsets: ['latin'],
  display: 'swap',
});

const hankenGrotesk = Hanken_Grotesk({
  variable: '--font-catalogue-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'RIO COLLECTION — Limited Archival T-Shirt Catalogue',
    template: '%s — RIO COLLECTION',
  },
  description:
    'Discover limited T-shirt drops, archival past designs, and brand stories from RIO COLLECTION.',
  openGraph: {
    title: 'RIO COLLECTION',
    description:
      'Independent limited T-shirt brand & archival catalogue.',
    siteName: 'RIO COLLECTION',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${ebGaramond.variable} ${hankenGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AppProvider>
          <React.Suspense fallback={null}>
            <TopLoader />
          </React.Suspense>
          <OfflineDetector />
          {children}
          <Toaster position="top-right" richColors />
        </AppProvider>
      </body>
    </html>
  );
}
