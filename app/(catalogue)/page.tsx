import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { HeroSection } from '@/components/catalogue/hero-section';
import { ProductCard } from '@/components/catalogue/product-card';
import { getProducts, getTestimonies } from '@/lib/api';
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
  const [products, testimonies] = await Promise.all([getProducts(), getTestimonies()]);
  const featuredProducts = products.slice(0, 3);

  return (
    <>
      {/* ═══ Hero Section ═══ */}
      <HeroSection />

      {/* ═══ Featured Products — "Koleksi Terkini" ═══ */}
      <section className="mx-auto max-w-350 px-4 md:px-16 py-16 md:py-24">
        {/* Section header */}
        <div className="flex items-end justify-between mb-10 md:mb-14">
          <h2 className="font-eb-garamond text-[28px] md:text-[40px] font-normal leading-tight text-(--cat-on-surface)">
            Koleksi Terkini
          </h2>
          <Link
            href="/catalogue"
            className="hidden md:inline-flex items-center gap-1.5 font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) hover:text-(--cat-on-surface) transition-colors duration-150"
          >
            Lihat Semua
            <ArrowRight size={12} strokeWidth={2} />
          </Link>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {featuredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 2} />
          ))}
        </div>

        {/* Mobile "View All" link */}
        <div className="mt-8 text-center md:hidden">
          <Link
            href="/catalogue"
            className="inline-flex items-center gap-1.5 font-hanken text-[12px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) hover:text-(--cat-on-surface) transition-colors duration-150"
          >
            Lihat Semua
            <ArrowRight size={12} strokeWidth={2} />
          </Link>
        </div>
      </section>

      {/* ═══ Brand Manifesto ═══ */}
      <section className="mx-auto max-w-350 px-4 md:px-16 py-8 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* Left: Image */}
          <div className="relative aspect-4/5 md:aspect-3/4 overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1200&auto=format&fit=crop&q=80"
              alt="RIO COLLECTION design studio — where every garmet is constructed with precision"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          {/* Right: Text */}
          <div className="flex flex-col justify-center py-4 md:py-12">
            <h2 className="font-eb-garamond text-[28px] md:text-[40px] font-normal leading-tight text-(--cat-on-surface)">
              Mendefinisikan Ulang
              <br />
              Esensi.
            </h2>
            <p className="mt-6 font-hanken text-[15px] md:text-[16px] leading-relaxed text-(--cat-on-surface-variant) max-w-md">
              RIO COLLECTION lahir dari keinginan untuk mengembalikan esensi berpakaian. Kami
              memandang setiap garmen sebagai kanvas modern, dirancang dengan presisi arsitektural
              dan material tak tertandingi.
            </p>
            <div className="mt-8">
              <Link
                href="/about"
                className="inline-block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) border-b border-(--cat-on-surface) pb-0.5 hover:opacity-70 transition-opacity duration-150"
              >
                Tentang Kami
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Testimony Section ═══ */}
      <TestimonySection testimonies={testimonies} />

      {/* ═══ CTA Banner ═══ */}
      <section className="mx-auto max-w-350 px-4 md:px-16 py-16 md:py-24">
        <div className="text-center py-12 md:py-16 border-t border-b border-(--cat-stone)">
          <p className="font-eb-garamond text-[22px] md:text-[28px] font-normal leading-relaxed text-(--cat-on-surface) max-w-2xl mx-auto italic">
            Setiap edisi adalah eksplorasi mandiri. Temukan siluet terbaru kami.
          </p>
          <div className="mt-8">
            <Link
              href="/catalogue"
              className="inline-flex items-center px-8 py-3 bg-(--cat-charcoal) text-white font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] hover:opacity-85 transition-opacity duration-150"
            >
              Eksplor Koleksi Terkini
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
