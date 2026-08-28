'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FilterTabs } from '@/components/catalogue/filter-tabs';
import { ProductCard } from '@/components/catalogue/product-card';
import { getProducts, getArchives } from '@/lib/api';
import type { Product, ArchiveCollection } from '@/types/catalogue.types';

const FILTER_TABS = ['ALL', 'AVAILABLE', 'ARCHIVE'];

export default function CataloguePage() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [products, setProducts] = useState<Product[]>([]);
  const [archives, setArchives] = useState<ArchiveCollection[]>([]);

  useEffect(() => {
    getProducts().then(setProducts).catch(console.error);
    getArchives().then(setArchives).catch(console.error);
  }, []);

  const filteredProducts = useMemo(() => {
    switch (activeTab) {
      case 'AVAILABLE':
        return products.filter((p) => p.status === 'AVAILABLE');
      case 'ARCHIVE':
        return products.filter((p) => p.status === 'SOLD_OUT');
      default:
        return products;
    }
  }, [activeTab, products]);

  return (
    <>
      {/* Header */}
      <section className="mx-auto max-w-[1400px] px-4 md:px-16 pt-8 md:pt-12 pb-6">
        {/* Breadcrumbs */}
        <nav
          className="mb-4 font-[family-name:var(--font-hanken)] text-[11px] uppercase tracking-[0.08em] text-[var(--cat-on-surface-variant)]"
          aria-label="Breadcrumb"
        >
          <Link
            href="/"
            className="hover:text-[var(--cat-on-surface)] transition-colors duration-150"
          >
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--cat-on-surface)] font-semibold">
            Catalogue
          </span>
        </nav>

        {/* Title */}
        <h1 className="font-[family-name:var(--font-eb-garamond)] text-[36px] md:text-[56px] font-normal leading-tight text-[var(--cat-on-surface)]">
          Catalogue
        </h1>
        <p className="mt-2 font-[family-name:var(--font-hanken)] text-[14px] md:text-[16px] text-[var(--cat-on-surface-variant)]">
          Explore the latest limited-edition T-shirt designs.
        </p>
      </section>

      {/* Filter tabs */}
      <section className="mx-auto max-w-[1400px] px-4 md:px-16 pb-8 md:pb-12">
        <FilterTabs
          tabs={FILTER_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </section>

      {/* Product Grid */}
      <section className="mx-auto max-w-[1400px] px-4 md:px-16 pb-16 md:pb-24">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 3}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="font-[family-name:var(--font-hanken)] text-[14px] text-[var(--cat-on-surface-variant)]">
              Tidak ada produk ditemukan.
            </p>
          </div>
        )}
      </section>

      {/* Historical Archive Section */}
      {activeTab !== 'AVAILABLE' && archives.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-4 md:px-16 pb-16 md:pb-24">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="font-[family-name:var(--font-eb-garamond)] text-[28px] md:text-[40px] font-normal leading-tight text-[var(--cat-on-surface)]">
              Historical Archive
            </h2>
            <p className="mt-2 font-[family-name:var(--font-hanken)] text-[14px] text-[var(--cat-on-surface-variant)]">
              Past editions, preserved.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {archives.map((archive) => (
              <Link
                key={archive.id}
                href={`/archive/${archive.slug}`}
                className="group block"
              >
                <div className="relative aspect-[3/2] overflow-hidden bg-[var(--cat-surface-container-low)]">
                  <Image
                    src={archive.imageUrl}
                    alt={archive.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
                <div className="mt-3">
                  <h3 className="font-[family-name:var(--font-hanken)] text-[15px] font-medium text-[var(--cat-on-surface)]">
                    {archive.name}
                  </h3>
                  <p className="mt-0.5 font-[family-name:var(--font-hanken)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cat-on-secondary-container)]">
                    Sold Out
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
