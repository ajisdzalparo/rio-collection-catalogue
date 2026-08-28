import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { getProducts, getArchives } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Archive',
  description:
    'Explore the historical archive of past RIO COLLECTION editions. Previous designs and past drops, preserved.'
};

export default async function ArchivePage() {
  const products = await getProducts();
  const archives = await getArchives();
  const archivedProducts = products.filter((p) => p.status === 'SOLD_OUT');

  return (
    <>
      {/* Header */}
      <section className="mx-auto max-w-350 px-4 md:px-16 pt-8 md:pt-12 pb-6">
        <nav
          className="mb-4 font-hanken text-[11px] uppercase tracking-[0.08em] text-(--cat-on-surface-variant)"
          aria-label="Breadcrumb"
        >
          <Link
            href="/"
            className="hover:text-(--cat-on-surface) transition-colors duration-150"
          >
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-(--cat-on-surface) font-semibold">Archive</span>
        </nav>

        <h1 className="font-eb-garamond text-[36px] md:text-[56px] font-normal leading-tight text-(--cat-on-surface)">
          Archive
        </h1>
        <p className="mt-2 font-hanken text-[14px] md:text-[16px] text-(--cat-on-surface-variant)">
          Previous designs and past drops.
        </p>
      </section>

      {/* Archived Products Grid */}
      <section className="mx-auto max-w-350 px-4 md:px-16 pb-12 md:pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {archivedProducts.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`} className="group block">
              <div className="relative aspect-4/5 overflow-hidden bg-(--cat-surface-container-low)">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                />
              </div>
              <div className="mt-3 flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-hanken text-[15px] font-medium text-(--cat-on-surface)">
                    {product.name}
                  </h3>
                  <p className="mt-0.5 font-hanken text-[12px] text-(--cat-on-surface-variant)">
                    {product.edition} — 2024
                  </p>
                </div>
                <span className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-secondary-container)">
                  Archived
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quote Banner */}
      <section className="bg-(--cat-surface-container-low)">
        <div className="mx-auto max-w-350 px-4 md:px-16 py-16 md:py-24 text-center">
          <p className="font-eb-garamond text-[24px] md:text-[36px] font-normal leading-relaxed text-(--cat-on-surface) italic max-w-2xl mx-auto">
            &quot;Merekam jejak perjalanan estetika kami.&quot;
          </p>
          <p className="mt-6 font-hanken text-[13px] md:text-[14px] leading-relaxed text-(--cat-on-surface-variant) max-w-lg mx-auto">
            This archive serves as a permanent record of our evolving dialogue with form, material,
            and time. Each piece documented here represents a singular iteration of our
            uncompromising commitment to slow fashion and independent craftsmanship—now retired, but
            foundational to our ongoing narrative.
          </p>
        </div>
      </section>

      {/* Archive Collections */}
      <section className="mx-auto max-w-350 px-4 md:px-16 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {archives.map((archive) => (
            <div key={archive.id} className="group">
              <div className="relative aspect-3/2 overflow-hidden bg-(--cat-surface-container-low)">
                <Image
                  src={archive.imageUrl}
                  alt={archive.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                />
              </div>
              <div className="mt-3 flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-hanken text-[15px] font-medium text-(--cat-on-surface)">
                    {archive.name}
                  </h3>
                  <p className="mt-0.5 font-hanken text-[12px] text-(--cat-on-surface-variant)">
                    {archive.description}
                  </p>
                </div>
                <span className="shrink-0 font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-secondary-container)">
                  Sold Out
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Archive Coming Soon */}
      <section className="mx-auto max-w-350 px-4 md:px-16 pb-16 md:pb-24">
        <div className="text-center py-12 border-t border-(--cat-stone)">
          <BookOpen
            size={24}
            strokeWidth={1.5}
            className="mx-auto text-(--cat-on-surface-variant) mb-4"
          />
          <p className="font-eb-garamond text-[22px] md:text-[28px] font-normal text-(--cat-on-surface) italic">
            &quot;Arsip sedang menunggu babak pertamanya.&quot;
          </p>
          <p className="mt-2 font-hanken text-[11px] uppercase tracking-[0.08em] text-(--cat-on-surface-variant)">
            The archive is waiting for its first chapter
          </p>
        </div>
      </section>
    </>
  );
}
