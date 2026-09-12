'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { FilterTabs } from '@/components/catalogue/filter-tabs';
import { ProductCard } from '@/components/catalogue/product-card';
import { cn } from '@/lib/utils';
import type { Product } from '@/types/catalogue.types';
import { isArchivedProductStatus } from '@/lib/product-availability';

const FILTER_TABS = ['ALL', 'AVAILABLE', 'ARCHIVE'];

interface CatalogueClientViewProps {
  products: Product[];
}

export function CatalogueClientView({ products }: CatalogueClientViewProps) {
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

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
      list = list.filter((p) => isArchivedProductStatus(p.status));
    }

    if (selectedCategory !== 'ALL') {
      list = list.filter((p) => p.category?.toLowerCase() === selectedCategory.toLowerCase());
    }

    return list;
  }, [activeTab, selectedCategory, products]);

  return (
    <>
      {/* Filter tabs & Category filter */}
      <section className="mx-auto max-w-350 px-4 md:px-16 pb-8 md:pb-10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <FilterTabs tabs={FILTER_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

          {categories.length > 0 && (
            <div
              className="relative flex items-center gap-2 self-start sm:self-auto"
              aria-label="Filter Kategori"
            >
              <span className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) shrink-0">
                Kategori:
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCategoryOpen((prev) => !prev)}
                  className="px-3.5 py-1.5 bg-(--cat-surface-container-low) border border-(--cat-stone) text-(--cat-on-surface) hover:border-(--cat-charcoal) inline-flex items-center gap-2 font-hanken text-[12px] font-medium transition-colors cursor-pointer"
                  aria-expanded={isCategoryOpen}
                >
                  <span className="capitalize">
                    {selectedCategory === 'ALL' ? 'Semua Kategori' : selectedCategory}
                  </span>
                  <ChevronDown
                    size={14}
                    className={cn(
                      'transition-transform duration-200 text-(--cat-on-surface-variant)',
                      isCategoryOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isCategoryOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsCategoryOpen(false)} />
                    <div className="absolute right-0 top-full mt-1.5 z-30 min-w-50 max-h-64 overflow-y-auto bg-(--cat-surface) border border-(--cat-stone) shadow-lg py-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory('ALL');
                          setIsCategoryOpen(false);
                        }}
                        className={cn(
                          'w-full px-4 py-2 text-left font-hanken text-[12px] flex items-center justify-between transition-colors cursor-pointer',
                          selectedCategory === 'ALL'
                            ? 'bg-(--cat-surface-container) text-(--cat-on-surface) font-semibold'
                            : 'text-(--cat-on-surface-variant) hover:bg-(--cat-surface-container-low) hover:text-(--cat-on-surface)'
                        )}
                      >
                        <span>Semua Kategori</span>
                        {selectedCategory === 'ALL' && (
                          <Check size={14} className="text-(--cat-charcoal)" />
                        )}
                      </button>

                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat);
                            setIsCategoryOpen(false);
                          }}
                          className={cn(
                            'w-full px-4 py-2 text-left font-hanken text-[12px] flex items-center justify-between transition-colors cursor-pointer capitalize',
                            selectedCategory.toLowerCase() === cat.toLowerCase()
                              ? 'bg-(--cat-surface-container) text-(--cat-on-surface) font-semibold'
                              : 'text-(--cat-on-surface-variant) hover:bg-(--cat-surface-container-low) hover:text-(--cat-on-surface)'
                          )}
                        >
                          <span>{cat}</span>
                          {selectedCategory.toLowerCase() === cat.toLowerCase() && (
                            <Check size={14} className="text-(--cat-charcoal)" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
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
    </>
  );
}
