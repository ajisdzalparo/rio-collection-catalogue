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
  display: 'swap'
});

const hankenGrotesk = Hanken_Grotesk({
  variable: '--font-catalogue-sans',
  subsets: ['latin'],
  display: 'swap'
});

const defaultUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rio-collection.ajisdzalparo.com';

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl.startsWith('http') ? defaultUrl : `https://${defaultUrl}`),
  title: {
    default: 'RIO COLLECTION — Limited Archival T-Shirt Catalogue',
    template: '%s — RIO COLLECTION'
  },
  description:
    'Discover limited T-shirt drops, archival past designs, and brand stories from RIO COLLECTION.',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/android-icon-192x192.png', sizes: '192x192', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-icon.png' }
    ],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/apple-icon-precomposed.png'
      }
    ]
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'RIO COLLECTION — Limited Archival T-Shirt Catalogue',
    description:
      'Discover limited T-shirt drops, archival past designs, and brand stories from RIO COLLECTION.',
    siteName: 'RIO COLLECTION',
    images: [
      {
        url: '/ms-icon-310x310.png',
        width: 310,
        height: 310,
        alt: 'RIO COLLECTION'
      }
    ],
    locale: 'id_ID',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RIO COLLECTION — Limited Archival T-Shirt Catalogue',
    description:
      'Discover limited T-shirt drops, archival past designs, and brand stories from RIO COLLECTION.',
    images: ['/ms-icon-310x310.png']
  }
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
