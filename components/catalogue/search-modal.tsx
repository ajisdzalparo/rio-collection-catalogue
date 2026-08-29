'use client';

import { useState, useEffect, useMemo } from 'react';
import { SafeImage } from '@/components/shared';
import Link from 'next/link';
import { Search, X, ArrowRight, Tag } from 'lucide-react';
import { getProducts } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types/catalogue.types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_SUGGESTIONS = [
  'Heavy-Weight Boxy Tee',
  'Graphic Edition',
  'Core Silhouette',
  'Essential Oversized',
  'Hitam'
];

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (isOpen) {
      getProducts().then(setProducts).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.color.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.edition.toLowerCase().includes(q)
    );
  }, [query, products]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-(--cat-surface-container-lowest) border border-(--cat-stone) rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] text-(--cat-on-surface)"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-(--cat-stone)">
          <Search className="h-5 w-5 text-(--cat-on-surface-variant) shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari produk, warna, edisi (misal: Boxy Tee, Hitam)..."
            className="w-full bg-transparent font-hanken text-base md:text-lg text-(--cat-on-surface) outline-none placeholder:text-(--cat-outline-variant)"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:opacity-70 text-(--cat-on-surface-variant) text-xs font-semibold cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-(--cat-surface-container-low) text-(--cat-on-surface-variant) transition-colors cursor-pointer"
            aria-label="Close search modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Body Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Quick suggestions when query is empty */}
          {!query.trim() && (
            <div className="space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-(--cat-on-surface-variant) flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Pencarian Populer
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_SUGGESTIONS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-3 py-1.5 text-xs font-hanken rounded-full bg-(--cat-surface-container-low) border border-(--cat-stone) hover:border-(--cat-charcoal) transition-all cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results List */}
          {query.trim() && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-(--cat-on-surface-variant)">
                <span>Hasil Pencarian ({searchResults.length})</span>
                {searchResults.length > 0 && (
                  <span className="text-[10px]">Klik produk untuk melihat detail</span>
                )}
              </div>

              <div className="space-y-2.5">
                {searchResults.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    onClick={onClose}
                    className="flex items-center gap-4 p-3 rounded-xl border border-transparent hover:border-(--cat-stone) hover:bg-(--cat-surface-container-low) transition-all group"
                  >
                    <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-(--cat-surface-container-low) border border-(--cat-stone)">
                      <SafeImage
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="56px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-hanken text-sm font-semibold text-(--cat-on-surface) truncate">
                        {product.name}
                      </h4>
                      <p className="text-xs text-(--cat-on-surface-variant) mt-0.5">
                        {product.color} — {product.edition}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-hanken text-xs font-medium text-(--cat-on-surface)">
                          {formatPrice(product.price)}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            product.status === 'AVAILABLE'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-zinc-500/10 text-zinc-500'
                          }`}
                        >
                          {product.status === 'AVAILABLE' ? 'Available' : 'Sold Out'}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-(--cat-on-surface-variant) opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}

                {searchResults.length === 0 && (
                  <div className="py-10 text-center space-y-1">
                    <p className="text-sm font-medium text-(--cat-on-surface)">
                      Tidak ditemukan produk untuk &quot;{query}&quot;
                    </p>
                    <p className="text-xs text-(--cat-on-surface-variant)">
                      Coba kata kunci lain seperti Boxy Tee, Graphic, atau Hitam.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
