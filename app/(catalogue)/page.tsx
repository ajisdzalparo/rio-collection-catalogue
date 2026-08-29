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
  title: 'RIO COLLECTION — Limited Archival T-Shirt Catalogue',
  description:
    'Discover limited T-shirt drops, archival past designs, and brand stories from RIO COLLECTION. Independent limited T-shirt brand & archival catalogue.',
  openGraph: {
    title: 'RIO COLLECTION — Limited Archival T-Shirt Catalogue',
    description: 'Independent limited T-shirt brand & archival catalogue.'
  }
};

export default async function HomePage() {
  const [products, testimonies, settings] = await Promise.all([
    getProducts(),
    getTestimonies(),
    prisma.storeSettings.findUnique({ where: { id: 'default' } }).catch(() => null)
  ]);
  const featuredProducts = products.slice(0, 3);
  const featuredTitle = settings?.homeFeaturedTitle || 'Koleksi Terkini';
  const viewAllLabel = settings?.homeViewAllLabel || 'Lihat Semua';
  const bannerText = settings?.homeBannerText || '';
  const bannerButton = settings?.homeBannerButton || '';

  return (
    <>
      {/* ═══ Hero Section ═══ */}
      <HeroSection />

      {/* ═══ Featured Products — "Koleksi Terkini" ═══ */}
      <section className="mx-auto max-w-350 px-4 md:px-16 py-16 md:py-24">
        {/* Section header */}
        <div className="flex items-end justify-between mb-10 md:mb-14">
          <h2 className="font-eb-garamond text-[28px] md:text-[40px] font-normal leading-tight text-(--cat-on-surface)">
            {featuredTitle}
          </h2>
          <Link
            href="/catalogue"
            className="hidden md:inline-flex items-center gap-1.5 font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) hover:text-(--cat-on-surface) transition-colors duration-150"
          >
            {viewAllLabel}
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
            {viewAllLabel}
            <ArrowRight size={12} strokeWidth={2} />
          </Link>
        </div>
      </section>

      {/* ═══ Brand Manifesto — fully CMS-driven, hidden when empty ═══ */}
      {(settings?.homeManifestoTitle || settings?.homeManifestoText) && (
        <section className="mx-auto max-w-350 px-4 md:px-16 py-8 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
            {settings?.homeManifestoImage && (
              <div className="relative aspect-4/5 md:aspect-3/4 overflow-hidden">
                <Image
                  src={settings.homeManifestoImage}
                  alt={settings.homeManifestoTitle || 'Brand manifesto'}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            )}

            <div className="flex flex-col justify-center py-4 md:py-12">
              <h2 className="font-eb-garamond text-[28px] md:text-[40px] font-normal leading-tight text-(--cat-on-surface)">
                {settings?.homeManifestoTitle}
              </h2>
              {settings?.homeManifestoText && (
                <p className="mt-6 font-hanken text-[15px] md:text-[16px] leading-relaxed text-(--cat-on-surface-variant) max-w-md">
                  {settings.homeManifestoText}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

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
