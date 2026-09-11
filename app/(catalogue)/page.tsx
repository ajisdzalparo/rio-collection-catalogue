import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { HeroSection } from '@/components/catalogue/hero-section';
import { ProductCard } from '@/components/catalogue/product-card';
import { getProducts, getTestimonies } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { TestimonySection } from '@/components/catalogue/testimony-section';

export const metadata: Metadata = {
  title: 'Limited Archival T-Shirt Catalogue',
  description:
    'Discover limited T-shirt drops, archival past designs, and brand stories from RIO COLLECTION. Independent limited T-shirt brand & archival catalogue.',
  openGraph: {
    title: 'RIO COLLECTION — Limited Archival T-Shirt Catalogue',
    description: 'Independent limited T-shirt brand & archival catalogue.',
    images: [
      {
        url: '/ms-icon-310x310.png',
        width: 310,
        height: 310,
        alt: 'RIO COLLECTION',
      },
    ],
  },
};

export default async function HomePage() {
  const [products, testimonies, settings] = await Promise.all([
    getProducts(),
    getTestimonies(),
    prisma.storeSettings.findUnique({ where: { id: 'default' } }).catch(() => null)
  ]);
  const featuredProducts = products.slice(0, 3);
  const bannerText = settings?.homeBannerText ?? 'Temukan rilisan edisi terbatas dan koleksi esensial RIO COLLECTION.';
  const bannerButton = settings?.homeBannerButton ?? 'Jelajahi Katalog Lengkap';

  return (
    <>
      {/* ═══ Hero Section ═══ */}
      <HeroSection settings={settings} />

      {/* ═══ Featured Products — "Koleksi Terkini" ═══ */}
      <section className="mx-auto max-w-350 px-4 md:px-16 py-16 md:py-24">
        {/* Section header */}
        <div className="flex items-end justify-between mb-10 md:mb-14">
          <h2 className="font-eb-garamond text-[28px] md:text-[40px] font-normal leading-tight text-(--cat-on-surface)">
            {settings?.homeFeaturedTitle || 'Koleksi Terkini'}
          </h2>
          <Link
            href="/catalogue"
            className="hidden md:inline-flex items-center gap-1.5 font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) hover:text-(--cat-on-surface) transition-colors duration-150"
          >
            {settings?.homeViewAllLabel || 'Lihat Semua'}
            <ArrowRight size={12} strokeWidth={2} />
          </Link>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {featuredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 2} />
          ))}
        </div>

        {featuredProducts.length === 0 && (
          <div className="text-center py-16 border border-dashed border-(--cat-stone)">
            <p className="font-hanken text-[14px] text-(--cat-on-surface-variant)">
              Belum ada produk. Tambahkan produk dari CMS dashboard.
            </p>
          </div>
        )}

        {/* Mobile "View All" link */}
        <div className="mt-8 text-center md:hidden">
          <Link
            href="/catalogue"
            className="inline-flex items-center gap-1.5 font-hanken text-[12px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) hover:text-(--cat-on-surface) transition-colors duration-150"
          >
            {settings?.homeViewAllLabel || 'Lihat Semua'}
            <ArrowRight size={12} strokeWidth={2} />
          </Link>
        </div>
      </section>

      {/* ═══ Brand Manifesto — fully CMS-driven, hidden when empty ═══ */}
      {/* ═══ Brand Manifesto Section ═══ */}
      {(() => {
        const title = settings?.homeManifestoTitle || 'Mendefinisikan Ulang Esensi Kualitas & Estetika.';
        const text = settings?.homeManifestoText || 'Setiap karya pakaian dari RIO COLLECTION lahir dari kombinasi riset bahan katun berbobot tinggi (240-280 GSM), siluet kaku modern, serta detail jahitan presisi. Kami menghadirkan pakaian esensial tahan lama yang berkarakter.';
        const image = settings?.homeManifestoImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80';

        return (
          <section className="mx-auto max-w-350 px-4 md:px-16 py-12 md:py-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div className="relative aspect-4/5 md:aspect-3/4 overflow-hidden bg-(--cat-surface-container-low)">
                <Image
                  src={image}
                  alt={title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col justify-center py-4 md:py-12">
                <span className="font-hanken text-[11px] font-bold uppercase tracking-[0.15em] text-(--cat-on-surface-variant) mb-3">
                  MANIFESTO &amp; FILOSOFI
                </span>
                <h2 className="font-eb-garamond text-[28px] md:text-[40px] font-normal leading-tight text-(--cat-on-surface)">
                  {title}
                </h2>
                <p className="mt-6 font-hanken text-[15px] md:text-[16px] leading-relaxed text-(--cat-on-surface-variant) max-w-md">
                  {text}
                </p>
              </div>
            </div>
          </section>
        );
      })()}

      {/* ═══ Testimony Section ═══ */}
      <TestimonySection testimonies={testimonies} />

      {/* ═══ CTA Banner — fully CMS-driven, hidden when empty ═══ */}
      {(bannerText || bannerButton) && (
        <section className="mx-auto max-w-350 px-4 md:px-16 py-16 md:py-24">
          <div className="text-center py-12 md:py-16 border-t border-b border-(--cat-stone)">
            {bannerText && (
              <p className="font-eb-garamond text-[22px] md:text-[28px] font-normal leading-relaxed text-(--cat-on-surface) max-w-2xl mx-auto italic">
                {bannerText}
              </p>
            )}
            {bannerButton && (
              <div className="mt-8">
                <Link
                  href="/catalogue"
                  className="inline-flex items-center px-8 py-3 bg-(--cat-charcoal) text-white font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] hover:opacity-85 transition-opacity duration-150"
                >
                  {bannerButton}
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
