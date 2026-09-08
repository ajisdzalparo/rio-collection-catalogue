'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FilterTabs } from '@/components/catalogue/filter-tabs';
import { ProductCard } from '@/components/catalogue/product-card';
import { cn } from '@/lib/utils';
import type { Product, ArchiveCollection } from '@/types/catalogue.types';

const FILTER_TABS = ['ALL', 'AVAILABLE', 'ARCHIVE'];

interface CatalogueClientViewProps {
  products: Product[];
  archives: ArchiveCollection[];
}

export function CatalogueClientView({ products, archives }: CatalogueClientViewProps) {
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeTab === 'AVAILABLE') {
      list = list.filter((p) => p.status === 'AVAILABLE');
    } else if (activeTab === 'ARCHIVE') {
      list = list.filter((p) => p.status === 'SOLD_OUT');
    }

    if (selectedCategory !== 'ALL') {
      list = list.filter(
        (p) => p.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    return list;
  }, [activeTab, selectedCategory, products]);

  return (
    <>
      {/* Filter tabs & Category filter */}
      <section className="mx-auto max-w-350 px-4 md:px-16 pb-8 md:pb-10 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <FilterTabs tabs={FILTER_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

          {categories.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap" aria-label="Kategori">
              <span className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mr-1">
                Kategori:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={cn(
                  'px-3 py-1.5 rounded-full font-hanken text-[12px] font-medium transition-colors cursor-pointer',
                  selectedCategory === 'ALL'
                    ? 'bg-(--cat-on-surface) text-(--cat-surface)'
                    : 'bg-(--cat-surface-container-low) text-(--cat-on-surface-variant) hover:text-(--cat-on-surface)'
                )}
              >
                Semua Kategori
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-full font-hanken text-[12px] font-medium transition-colors cursor-pointer',
                    selectedCategory === cat
                      ? 'bg-(--cat-on-surface) text-(--cat-surface)'
                      : 'bg-(--cat-surface-container-low) text-(--cat-on-surface-variant) hover:text-(--cat-on-surface)'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Product Grid */}
      <section className="mx-auto max-w-350 px-4 md:px-16 pb-16 md:pb-24">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 3} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="font-hanken text-[14px] text-(--cat-on-surface-variant)">
              Tidak ada produk ditemukan.
            </p>
          </div>
        )}
      </section>

      {/* Historical Archive Section */}
      {activeTab !== 'AVAILABLE' && archives.length > 0 && (
        <section className="mx-auto max-w-350 px-4 md:px-16 pb-16 md:pb-24">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="font-eb-garamond text-[28px] md:text-[40px] font-normal leading-tight text-(--cat-on-surface)">
              Historical Archive
            </h2>
            <p className="mt-2 font-hanken text-[14px] text-(--cat-on-surface-variant)">
              Past editions, preserved.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {archives.map((archive) => (
              <Link key={archive.id} href="/archive" className="group block">
                <div className="relative aspect-3/2 overflow-hidden bg-(--cat-surface-container-low)">
                  <Image
                    src={archive.imageUrl}
                    alt={archive.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
                <div className="mt-3">
                  <h3 className="font-hanken text-[15px] font-medium text-(--cat-on-surface)">
                    {archive.name}
                  </h3>
                  <p className="mt-0.5 font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-secondary-container)">
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
