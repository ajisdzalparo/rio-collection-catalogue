'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { SafeImage } from '@/components/shared';
import Link from 'next/link';
import { Search, X, ArrowRight, Clock, Trash2 } from 'lucide-react';
import { getProducts } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types/catalogue.types';
import { useDebounce } from '@/hooks/use-debounce';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RECENT_SEARCHES_KEY = 'rio_recent_searches';

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 250);
  const [products, setProducts] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, 5);
        }
      }
    } catch {
      // Ignore localStorage read errors
    }
    return [];
  });

  // Load products and refresh recent searches when modal opens
  useEffect(() => {
    if (isOpen) {
      getProducts().then(setProducts).catch(console.error);
      try {
        const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            queueMicrotask(() => {
              setRecentSearches(parsed.slice(0, 5));
            });
          }
        }
      } catch {
        // Ignore localStorage read errors
      }
    }
  }, [isOpen]);

  // Handle ESC key to close modal
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

  // Save search query into recent searches
  const saveSearchQuery = useCallback((term: string) => {
    const clean = term.trim();
    if (!clean) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const next = [clean, ...filtered].slice(0, 5);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {
        // Ignore localStorage write errors
      }
      return next;
    });
  }, []);

  const handleRemoveRecent = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const next = prev.filter((item) => item !== term);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const handleClearAllRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore
    }
  };

  // Dynamic suggestions extracted directly from loaded products
  const dynamicSuggestions = useMemo(() => {
    const suggestions = new Set<string>();

    products.forEach((p) => {
      if (p.status === 'AVAILABLE' && p.name) {
        suggestions.add(p.name.trim());
      }
      if (p.edition && p.edition.trim()) {
        suggestions.add(p.edition.trim());
      }
      if (p.category && p.category.trim()) {
        suggestions.add(p.category.trim());
      }
    });

    return Array.from(suggestions).slice(0, 8);
  }, [products]);

  // Dynamic available colors with hex previews
  const dynamicColors = useMemo(() => {
    const colorMap = new Map<string, string>();
    products.forEach((p) => {
      if (p.color && p.color.trim()) {
        colorMap.set(p.color.trim(), p.colorHex || '#18181b');
      }
      if (Array.isArray(p.colors) && Array.isArray(p.colorHexes)) {
        p.colors.forEach((c, idx) => {
          if (c && c.trim() && !colorMap.has(c.trim())) {
            colorMap.set(c.trim(), p.colorHexes?.[idx] || '#18181b');
          }
        });
      }
    });
    return Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex }));
  }, [products]);

  // Filter products by debounced query
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.color?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.edition?.toLowerCase().includes(q)
    );
  }, [debouncedQuery, products]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveSearchQuery(query);
    }
  };

  const handleSelectSuggestion = (term: string) => {
    setQuery(term);
    saveSearchQuery(term);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-(--cat-surface-container-lowest) border border-(--cat-stone) rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] text-(--cat-on-surface)"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-3 px-5 py-3.5 border-b border-(--cat-stone)"
        >
          <Search className="h-4.5 w-4.5 text-(--cat-on-surface-variant) shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari produk, warna, edisi (misal: Boxy Tee, Hitam)..."
            className="w-full bg-transparent font-hanken text-sm md:text-base text-(--cat-on-surface) outline-none placeholder:text-(--cat-outline-variant)"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 hover:opacity-70 text-(--cat-on-surface-variant) text-xs font-semibold cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-(--cat-surface-container-low) text-(--cat-on-surface-variant) transition-colors cursor-pointer"
            aria-label="Close search modal"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </form>

        {/* Search Body Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Dynamic Suggestions (Shown when query is empty) */}
          {!query.trim() && (
            <div className="space-y-4">
              {/* Recent Searches (from localStorage) */}
              {recentSearches.length > 0 && (
                <div className="space-y-2 pb-3 border-b border-(--cat-stone)/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-(--cat-on-surface-variant) flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      Pencarian Terakhir
                    </span>
                    <button
                      type="button"
                      onClick={handleClearAllRecent}
                      className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                      Hapus
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => handleSelectSuggestion(term)}
                        className="group flex items-center gap-1.5 px-3 py-1 text-xs font-hanken rounded-lg bg-(--cat-surface-container-low) border border-(--cat-stone) hover:border-(--cat-charcoal) transition-all cursor-pointer"
                      >
                        <span>{term}</span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => handleRemoveRecent(term, e)}
                          className="text-muted-foreground group-hover:text-foreground p-0.5 rounded hover:bg-muted/40"
                          title="Hapus riwayat ini"
                        >
                          <X className="h-2.5 w-2.5" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Categories & Editions from live products */}
              {dynamicSuggestions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-(--cat-on-surface-variant)">
                    Saran & Edisi Populer
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {dynamicSuggestions.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleSelectSuggestion(tag)}
                        className="px-3 py-1.5 text-xs font-hanken rounded-lg bg-(--cat-surface-container-low) border border-(--cat-stone) hover:border-(--cat-charcoal) transition-all cursor-pointer"
                      >
                        <span>{tag}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Available Colors */}
              {dynamicColors.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-(--cat-on-surface-variant)">
                    Pilihan Warna
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {dynamicColors.map(({ name }) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleSelectSuggestion(name)}
                        className="px-3 py-1.5 text-xs font-hanken rounded-lg bg-(--cat-surface-container-low) border border-(--cat-stone) hover:border-(--cat-charcoal) transition-all cursor-pointer capitalize"
                      >
                        <span>{name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search Results List */}
          {query.trim() && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-(--cat-on-surface-variant)">
                <span>Hasil Pencarian ({searchResults.length})</span>
                {searchResults.length > 0 && (
                  <span className="text-[10px]">Klik produk untuk melihat detail</span>
                )}
              </div>

              <div className="space-y-2">
                {searchResults.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug || product.id}`}
                    onClick={() => {
                      saveSearchQuery(product.name);
                      onClose();
                    }}
                    className="flex items-center gap-3.5 p-2.5 rounded-lg border border-transparent hover:border-(--cat-stone) hover:bg-(--cat-surface-container-low) transition-all group"
                  >
                    <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-md bg-(--cat-surface-container-low) border border-(--cat-stone)">
                      <SafeImage
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="48px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-hanken text-sm font-semibold text-(--cat-on-surface) truncate">
                        {product.name}
                      </h4>
                      <p className="text-xs text-(--cat-on-surface-variant) mt-0.5">
                        {product.color} {product.edition ? `— ${product.edition}` : ''}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-hanken text-xs font-medium text-(--cat-on-surface)">
                          {formatPrice(product.price)}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            product.status === 'AVAILABLE'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
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
                  <div className="py-10 text-center space-y-1.5">
                    <p className="text-sm font-medium text-(--cat-on-surface)">
                      Tidak ditemukan produk untuk &quot;{query}&quot;
                    </p>
                    <p className="text-xs text-(--cat-on-surface-variant)">
                      Coba gunakan kata kunci lain seperti nama produk, warna, atau edisi kaos.
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
