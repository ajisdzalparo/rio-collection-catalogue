'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { ProductCard } from '@/components/catalogue/product-card';
import { cn } from '@/lib/utils';
import { sortSizes } from '@/lib/size-sorter';
import { useCategoriesQuery, useColorsQuery, useSizesQuery } from '@/hooks/use-master-data';
import type { Product } from '@/types/catalogue.types';
import { isArchivedProductStatus } from '@/lib/product-availability';

const SORT_OPTIONS = [
  { id: 'FEATURED', label: 'Unggulan' },
  { id: 'NEWEST', label: 'Terbaru' },
  { id: 'PRICE_ASC', label: 'Harga Terendah' },
  { id: 'PRICE_DESC', label: 'Harga Tertinggi' },
  { id: 'NAME_ASC', label: 'Nama (A - Z)' }
];

const PRICE_RANGES = [
  { id: 'ALL', label: 'Semua Rentang', min: 0, max: Infinity },
  { id: 'UNDER_150K', label: 'Di bawah Rp 150.000', min: 0, max: 150000 },
  { id: '150K_250K', label: 'Rp 150.000 – Rp 250.000', min: 150000, max: 250000 },
  { id: '250K_370K', label: 'Rp 250.000 – Rp 370.000', min: 250000, max: 370000 },
  { id: 'ABOVE_370K', label: 'Di atas Rp 370.000', min: 370000, max: Infinity }
];

interface CatalogueClientViewProps {
  products: Product[];
}

export function CatalogueClientView({ products }: CatalogueClientViewProps) {
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [productType, setProductType] = useState<
    'ALL' | 'AVAILABLE' | 'PRE_ORDER' | 'COMING_SOON' | 'ARCHIVE'
  >('ALL');
  const [availability, setAvailability] = useState<'ALL' | 'IN_STOCK'>('ALL');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState('ALL');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('FEATURED');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Accordion open/close states
  const [openSections, setOpenSections] = useState({
    category: true,
    type: true,
    availability: true,
    color: true,
    price: true,
    size: true
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Debounce search query by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Lock body scroll when mobile filter is open
  useEffect(() => {
    if (isMobileFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileFilterOpen]);

  // Master Data Queries
  const { data: masterCategories = [] } = useCategoriesQuery();
  const { data: masterColors = [] } = useColorsQuery();
  const { data: masterSizes = [] } = useSizesQuery();

  // Active Master Data
  const activeMasterCategories = useMemo(
    () => masterCategories.filter((c) => c.isActive && !c.deletedAt),
    [masterCategories]
  );
  const activeMasterColors = useMemo(
    () => masterColors.filter((c) => c.isActive && !c.deletedAt),
    [masterColors]
  );
  const activeMasterSizes = useMemo(
    () => masterSizes.filter((s) => s.isActive && !s.deletedAt),
    [masterSizes]
  );

  // Categories directly from Master Data (with product counts)
  const availableCategories = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => {
      if (p.category?.trim()) {
        const cat = p.category.trim().toLowerCase();
        counts.set(cat, (counts.get(cat) || 0) + 1);
      }
    });

    if (activeMasterCategories.length > 0) {
      return activeMasterCategories.map((c) => ({
        name: c.name,
        count: counts.get(c.name.toLowerCase()) || 0
      }));
    }

    return Array.from(counts.entries())
      .map(([name, count]) => {
        const original =
          products.find((p) => p.category?.trim().toLowerCase() === name)?.category?.trim() || name;
        return { name: original, count };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, activeMasterCategories]);

  // Colors directly from Master Data (with accurate hex & product counts)
  const availableColors = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => {
      const colors = p.colors?.length ? p.colors : [p.color].filter(Boolean);
      colors.forEach((c) => {
        const key = c?.trim().toLowerCase();
        if (key) counts.set(key, (counts.get(key) || 0) + 1);
      });
    });

    if (activeMasterColors.length > 0) {
      return activeMasterColors.map((c) => ({
        name: c.name,
        hex: c.hex || '#1A1A1A',
        count: counts.get(c.name.toLowerCase()) || 0
      }));
    }

    const map = new Map<string, { name: string; hex: string; count: number }>();
    products.forEach((p) => {
      const colors = p.colors?.length ? p.colors : [p.color].filter(Boolean);
      const hexes = p.colorHexes?.length ? p.colorHexes : [p.colorHex].filter(Boolean);

      colors.forEach((c, idx) => {
        const trimmed = c?.trim();
        if (!trimmed) return;
        const key = trimmed.toLowerCase();
        const hex = hexes[idx] || '#1A1A1A';

        if (!map.has(key)) {
          map.set(key, { name: trimmed, hex, count: 1 });
        } else {
          map.get(key)!.count += 1;
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products, activeMasterColors]);

  // Sizes directly from Master Data (with product counts & natural sorting)
  const availableSizes = useMemo(() => {
    const sizeCounts = new Map<string, number>();
    products.forEach((p) => {
      if (Array.isArray(p.variants)) {
        p.variants.forEach((v) => {
          if (v.size?.trim()) {
            const s = v.size.trim().toUpperCase();
            sizeCounts.set(s, (sizeCounts.get(s) || 0) + 1);
          }
        });
      }
    });

    if (activeMasterSizes.length > 0) {
      const sortedMaster = sortSizes(activeMasterSizes.map((s) => s.size.toUpperCase()));
      return sortedMaster.map((size) => ({
        size,
        count: sizeCounts.get(size) || 0
      }));
    }

    const sorted = sortSizes(Array.from(sizeCounts.keys()));
    return sorted.map((size) => ({ size, count: sizeCounts.get(size) || 0 }));
  }, [products, activeMasterSizes]);

  // Toggle helpers
  const toggleCategory = (categoryName: string) => {
    setSelectedCategories((prev) => {
      const exists = prev.some((c) => c.toLowerCase() === categoryName.toLowerCase());
      return exists
        ? prev.filter((c) => c.toLowerCase() !== categoryName.toLowerCase())
        : [...prev, categoryName];
    });
  };

  const toggleColor = (colorName: string) => {
    setSelectedColors((prev) => {
      const exists = prev.some((c) => c.toLowerCase() === colorName.toLowerCase());
      return exists
        ? prev.filter((c) => c.toLowerCase() !== colorName.toLowerCase())
        : [...prev, colorName];
    });
  };

  const toggleSize = (sizeName: string) => {
    setSelectedSizes((prev) => {
      const exists = prev.some((s) => s.toUpperCase() === sizeName.toUpperCase());
      return exists
        ? prev.filter((s) => s.toUpperCase() !== sizeName.toUpperCase())
        : [...prev, sizeName];
    });
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSelectedCategories([]);
    setProductType('ALL');
    setAvailability('ALL');
    setSelectedColors([]);
    setSelectedPriceRange('ALL');
    setSelectedSizes([]);
    setSortBy('FEATURED');
  };

  // Instant filtering & sorting
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      // Search query filter (using debounced value)
      if (debouncedSearchQuery.trim()) {
        const query = debouncedSearchQuery.trim().toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesCat = (p.category || '').toLowerCase().includes(query);
        const matchesColor = (p.color || '').toLowerCase().includes(query);
        const matchesDesc = (p.description || '').toLowerCase().includes(query);
        if (!matchesName && !matchesCat && !matchesColor && !matchesDesc) {
          return false;
        }
      }

      // 1. Product Type / Status filter
      if (productType === 'AVAILABLE') {
        if (p.status !== 'AVAILABLE') return false;
      } else if (productType === 'PRE_ORDER') {
        if (p.status !== 'PRE_ORDER') return false;
      } else if (productType === 'COMING_SOON') {
        if (p.status !== 'COMING_SOON') return false;
      } else if (productType === 'ARCHIVE') {
        if (!isArchivedProductStatus(p.status)) return false;
      }

      // 2. Availability (In Stock) filter
      if (availability === 'IN_STOCK') {
        const isAlways = p.stockMode === 'ALWAYS_AVAILABLE';
        const hasQuantity = (p.stock ?? 0) > 0;
        const hasVariantInStock =
          Array.isArray(p.variants) && p.variants.some((v) => v.inStock && (v.stock ?? 0) > 0);
        if (!isAlways && !hasQuantity && !hasVariantInStock) {
          return false;
        }
      }

      // 3. Multi-Category filter
      if (selectedCategories.length > 0) {
        const pCat = (p.category || '').toLowerCase();
        const matchesCat = selectedCategories.some((c) => c.toLowerCase() === pCat);
        if (!matchesCat) return false;
      }

      // 4. Color filter
      if (selectedColors.length > 0) {
        const pColors = (p.colors?.length ? p.colors : [p.color].filter(Boolean)).map((c) =>
          c.toLowerCase()
        );
        const matchesColor = selectedColors.some((sc) => pColors.includes(sc.toLowerCase()));
        if (!matchesColor) return false;
      }

      // 5. Price Range filter
      if (selectedPriceRange !== 'ALL') {
        const range = PRICE_RANGES.find((r) => r.id === selectedPriceRange);
        if (range) {
          if (p.price < range.min || p.price > range.max) {
            return false;
          }
        }
      }

      // 6. Size filter
      if (selectedSizes.length > 0) {
        const pVariants = Array.isArray(p.variants) ? p.variants : [];
        const matchesSize = selectedSizes.some((ss) =>
          pVariants.some(
            (v) =>
              v.size.toUpperCase() === ss.toUpperCase() &&
              (p.stockMode === 'ALWAYS_AVAILABLE' || v.inStock)
          )
        );
        if (!matchesSize) return false;
      }

      return true;
    });

    // Apply Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'PRICE_ASC') return a.price - b.price;
      if (sortBy === 'PRICE_DESC') return b.price - a.price;
      if (sortBy === 'NAME_ASC') return a.name.localeCompare(b.name);
      if (sortBy === 'NEWEST') {
        const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
        return dateB - dateA;
      }
      return 0; // FEATURED (default original order)
    });

    return result;
  }, [
    products,
    debouncedSearchQuery,
    productType,
    availability,
    selectedCategories,
    selectedColors,
    selectedPriceRange,
    selectedSizes,
    sortBy
  ]);

  const totalActiveFilters =
    (debouncedSearchQuery.trim() ? 1 : 0) +
    (productType !== 'ALL' ? 1 : 0) +
    (availability !== 'ALL' ? 1 : 0) +
    selectedCategories.length +
    selectedColors.length +
    (selectedPriceRange !== 'ALL' ? 1 : 0) +
    selectedSizes.length;

  const renderFilterSidebar = () => (
    <div className="space-y-6 text-xs font-hanken">
      {/* 1. Search Box */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-(--cat-on-surface-variant)"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari katalog..."
          className="w-full pl-9 pr-8 py-2.5 bg-transparent border border-(--cat-stone) rounded-md text-(--cat-on-surface) placeholder:text-(--cat-on-surface-variant)/50 text-[13px] font-hanken focus:outline-none focus:border-(--cat-charcoal) transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-(--cat-on-surface-variant) hover:text-(--cat-on-surface) cursor-pointer"
            title="Hapus pencarian"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Accordion Sections - Clean Editorial Divider */}
      <div className="divide-y divide-(--cat-stone)">
        {/* 2. Kategori */}
        {availableCategories.length > 0 && (
          <div className="py-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleSection('category')}
              className="w-full flex items-center justify-between font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) cursor-pointer select-none"
            >
              <span>Kategori</span>
              {openSections.category ? (
                <ChevronUp size={14} className="text-(--cat-on-surface-variant)" />
              ) : (
                <ChevronDown size={14} className="text-(--cat-on-surface-variant)" />
              )}
            </button>
            {openSections.category && (
              <div className="space-y-2 pt-1">
                {availableCategories.map((item) => {
                  const isChecked = selectedCategories.some(
                    (c) => c.toLowerCase() === item.name.toLowerCase()
                  );
                  return (
                    <label
                      key={item.name}
                      onClick={() => toggleCategory(item.name)}
                      className="flex items-center justify-between text-(--cat-on-surface-variant) hover:text-(--cat-on-surface) cursor-pointer select-none transition-colors py-0.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={cn(
                            'w-3.5 h-3.5 border flex items-center justify-center text-[9px] shrink-0 transition-colors',
                            isChecked
                              ? 'bg-(--cat-charcoal) border-(--cat-charcoal) text-white'
                              : 'border-(--cat-stone) bg-transparent'
                          )}
                        >
                          {isChecked && <Check size={10} strokeWidth={3} />}
                        </span>
                        <span
                          className={cn(
                            'capitalize text-[13px] font-normal truncate',
                            isChecked && 'font-medium text-(--cat-on-surface)'
                          )}
                        >
                          {item.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-(--cat-on-surface-variant)/60 tabular-nums">
                        {item.count}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. Tipe Produk */}
        <div className="py-4 space-y-3">
          <button
            type="button"
            onClick={() => toggleSection('type')}
            className="w-full flex items-center justify-between font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) cursor-pointer select-none"
          >
            <span>Tipe Produk</span>
            {openSections.type ? (
              <ChevronUp size={14} className="text-(--cat-on-surface-variant)" />
            ) : (
              <ChevronDown size={14} className="text-(--cat-on-surface-variant)" />
            )}
          </button>
          {openSections.type && (
            <div className="space-y-2 pt-1">
              {[
                { id: 'ALL', label: 'Semua Produk' },
                { id: 'AVAILABLE', label: 'Ready Stock' },
                { id: 'PRE_ORDER', label: 'Pre-Order' },
                { id: 'COMING_SOON', label: 'Segera Hadir' },
                { id: 'ARCHIVE', label: 'Arsip / Terjual' }
              ].map((t) => {
                const isSelected = productType === t.id;
                return (
                  <label
                    key={t.id}
                    onClick={() => setProductType(t.id as typeof productType)}
                    className="flex items-center gap-2.5 text-(--cat-on-surface-variant) hover:text-(--cat-on-surface) cursor-pointer select-none transition-colors py-0.5"
                  >
                    <span
                      className={cn(
                        'w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors',
                        isSelected ? 'border-(--cat-charcoal)' : 'border-(--cat-stone)'
                      )}
                    >
                      {isSelected && <span className="w-2 h-2 rounded-full bg-(--cat-charcoal)" />}
                    </span>
                    <span
                      className={cn(
                        'text-[13px] font-normal',
                        isSelected && 'font-medium text-(--cat-on-surface)'
                      )}
                    >
                      {t.label}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Ketersediaan */}
        <div className="py-4 space-y-3">
          <button
            type="button"
            onClick={() => toggleSection('availability')}
            className="w-full flex items-center justify-between font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) cursor-pointer select-none"
          >
            <span>Ketersediaan</span>
            {openSections.availability ? (
              <ChevronUp size={14} className="text-(--cat-on-surface-variant)" />
            ) : (
              <ChevronDown size={14} className="text-(--cat-on-surface-variant)" />
            )}
          </button>
          {openSections.availability && (
            <div className="space-y-2 pt-1">
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'IN_STOCK', label: 'Ada Stok Tersedia' }
              ].map((a) => {
                const isSelected = availability === a.id;
                return (
                  <label
                    key={a.id}
                    onClick={() => setAvailability(a.id as typeof availability)}
                    className="flex items-center gap-2.5 text-(--cat-on-surface-variant) hover:text-(--cat-on-surface) cursor-pointer select-none transition-colors py-0.5"
                  >
                    <span
                      className={cn(
                        'w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors',
                        isSelected ? 'border-(--cat-charcoal)' : 'border-(--cat-stone)'
                      )}
                    >
                      {isSelected && <span className="w-2 h-2 rounded-full bg-(--cat-charcoal)" />}
                    </span>
                    <span
                      className={cn(
                        'text-[13px] font-normal',
                        isSelected && 'font-medium text-(--cat-on-surface)'
                      )}
                    >
                      {a.label}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Warna */}
        {availableColors.length > 0 && (
          <div className="py-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleSection('color')}
              className="w-full flex items-center justify-between font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) cursor-pointer select-none"
            >
              <span>Warna</span>
              {openSections.color ? (
                <ChevronUp size={14} className="text-(--cat-on-surface-variant)" />
              ) : (
                <ChevronDown size={14} className="text-(--cat-on-surface-variant)" />
              )}
            </button>
            {openSections.color && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {availableColors.map((item) => {
                  const isSelected = selectedColors.some(
                    (c) => c.toLowerCase() === item.name.toLowerCase()
                  );
                  const isLight =
                    item.hex.toLowerCase() === '#ffffff' ||
                    item.hex.toLowerCase() === '#fff' ||
                    item.hex.toLowerCase() === '#fafafa';

                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => toggleColor(item.name)}
                      className={cn(
                        'px-2.5 py-1 text-[12px] font-hanken border transition-all cursor-pointer inline-flex items-center gap-2',
                        isSelected
                          ? 'bg-(--cat-charcoal) text-white border-(--cat-charcoal) font-medium'
                          : 'bg-transparent text-(--cat-on-surface) border-(--cat-stone) hover:border-(--cat-charcoal)'
                      )}
                      title={`Warna ${item.name}`}
                    >
                      <span
                        className={cn(
                          'w-2.5 h-2.5 rounded-full shrink-0 border',
                          isLight ? 'border-stone-400' : 'border-black/20'
                        )}
                        style={{ backgroundColor: item.hex }}
                      />
                      <span className="capitalize">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 6. Harga */}
        <div className="py-4 space-y-3">
          <button
            type="button"
            onClick={() => toggleSection('price')}
            className="w-full flex items-center justify-between font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) cursor-pointer select-none"
          >
            <span>Harga</span>
            {openSections.price ? (
              <ChevronUp size={14} className="text-(--cat-on-surface-variant)" />
            ) : (
              <ChevronDown size={14} className="text-(--cat-on-surface-variant)" />
            )}
          </button>
          {openSections.price && (
            <div className="space-y-2 pt-1">
              {PRICE_RANGES.map((pr) => {
                const isSelected = selectedPriceRange === pr.id;
                return (
                  <label
                    key={pr.id}
                    onClick={() => setSelectedPriceRange(pr.id)}
                    className="flex items-center gap-2.5 text-(--cat-on-surface-variant) hover:text-(--cat-on-surface) cursor-pointer select-none transition-colors py-0.5"
                  >
                    <span
                      className={cn(
                        'w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors',
                        isSelected ? 'border-(--cat-charcoal)' : 'border-(--cat-stone)'
                      )}
                    >
                      {isSelected && <span className="w-2 h-2 rounded-full bg-(--cat-charcoal)" />}
                    </span>
                    <span
                      className={cn(
                        'text-[13px] font-normal',
                        isSelected && 'font-medium text-(--cat-on-surface)'
                      )}
                    >
                      {pr.label}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 7. Ukuran */}
        {availableSizes.length > 0 && (
          <div className="py-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleSection('size')}
              className="w-full flex items-center justify-between font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) cursor-pointer select-none"
            >
              <span>Ukuran</span>
              {openSections.size ? (
                <ChevronUp size={14} className="text-(--cat-on-surface-variant)" />
              ) : (
                <ChevronDown size={14} className="text-(--cat-on-surface-variant)" />
              )}
            </button>
            {openSections.size && (
              <div className="grid grid-cols-4 gap-2 pt-1">
                {availableSizes.map((item) => {
                  const isSelected = selectedSizes.some(
                    (s) => s.toUpperCase() === item.size.toUpperCase()
                  );
                  return (
                    <button
                      key={item.size}
                      type="button"
                      onClick={() => toggleSize(item.size)}
                      className={cn(
                        'h-9 font-hanken text-[12px] font-medium uppercase border rounded-md transition-all cursor-pointer flex items-center justify-center',
                        isSelected
                          ? 'bg-(--cat-charcoal) text-white border-(--cat-charcoal)'
                          : 'bg-transparent text-(--cat-on-surface) border-(--cat-stone) hover:border-(--cat-charcoal)'
                      )}
                    >
                      {item.size}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reset Filter Button */}
      {totalActiveFilters > 0 && (
        <button
          type="button"
          onClick={resetAllFilters}
          className="w-full py-2.5 text-[11px] font-hanken font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) hover:text-(--cat-on-surface) border border-(--cat-stone) rounded-md hover:border-(--cat-charcoal) transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
        >
          <RotateCcw size={12} />
          <span>Reset Semua Filter</span>
        </button>
      )}
    </div>
  );

  return (
    <section className="mx-auto max-w-350 px-4 md:px-16 pb-16 md:pb-24">
      {/* Mobile Top Controls Toolbar */}
      <div className="md:hidden flex items-center justify-between gap-3 mb-6 pb-3 border-b border-(--cat-stone)">
        <button
          type="button"
          onClick={() => setIsMobileFilterOpen(true)}
          className="flex-1 py-2.5 px-4 bg-transparent border border-(--cat-stone) rounded-md text-(--cat-on-surface) font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
        >
          <SlidersHorizontal size={13} />
          <span>Filter</span>
          {totalActiveFilters > 0 && (
            <span className="px-1.5 py-0.2 bg-(--cat-charcoal) text-white text-[10px] font-bold">
              {totalActiveFilters}
            </span>
          )}
        </button>

        {/* Mobile Sort Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSortOpen((prev) => !prev)}
            className="py-2.5 px-3.5 border border-(--cat-stone) rounded-md text-(--cat-on-surface) font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] inline-flex items-center gap-1.5 cursor-pointer bg-transparent"
          >
            <span>Urutkan</span>
            <ChevronDown
              size={13}
              className={cn('transition-transform', isSortOpen && 'rotate-180')}
            />
          </button>
          {isSortOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-52 bg-(--cat-surface) border border-(--cat-stone) rounded-md shadow-xl py-1">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSortBy(opt.id);
                      setIsSortOpen(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left font-hanken text-[12px] flex items-center justify-between cursor-pointer transition-colors',
                      sortBy === opt.id
                        ? 'bg-(--cat-surface-container) font-semibold text-(--cat-on-surface)'
                        : 'text-(--cat-on-surface-variant) hover:bg-(--cat-surface-container-low)'
                    )}
                  >
                    <span>{opt.label}</span>
                    {sortBy === opt.id && <Check size={13} className="text-(--cat-charcoal)" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Framed Sidebar (Desktop) */}
        <aside className="hidden md:block md:col-span-4 lg:col-span-3 md:sticky md:top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1 scrollbar-none">
          <div className="border border-(--cat-stone) rounded-lg bg-(--cat-surface) p-4 md:p-5 shadow-2xs">
            {renderFilterSidebar()}
          </div>
        </aside>

        {/* Right Column: Products Header & Grid */}
        <div className="md:col-span-8 lg:col-span-9 space-y-6">
          {/* Header Top Bar (Desktop) */}
          <div className="hidden md:flex items-center justify-between border-b border-(--cat-stone) pb-4">
            <div>
              <h2 className="font-eb-garamond text-[32px] md:text-[38px] font-normal leading-tight text-(--cat-on-surface)">
                {selectedCategories.length === 1
                  ? selectedCategories[0]
                  : selectedCategories.length > 1
                    ? `${selectedCategories.join(', ')}`
                    : 'Semua Koleksi'}
              </h2>
              <p className="font-hanken text-[12px] text-(--cat-on-surface-variant) mt-0.5">
                Menampilkan{' '}
                <strong className="text-(--cat-on-surface)">{filteredProducts.length}</strong> dari{' '}
                {products.length} produk
              </p>
            </div>

            {/* Desktop Sort Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortOpen((prev) => !prev)}
                className="px-3.5 py-2 border border-(--cat-stone) rounded-md text-(--cat-on-surface) font-hanken text-[11px] uppercase tracking-[0.08em] font-semibold inline-flex items-center gap-2 hover:border-(--cat-charcoal) transition-colors cursor-pointer bg-transparent"
              >
                <span>
                  urutan :{' '}
                  <strong className="font-bold">
                    {SORT_OPTIONS.find((s) => s.id === sortBy)?.label}
                  </strong>
                </span>
                <ChevronDown
                  size={13}
                  className={cn('transition-transform duration-150', isSortOpen && 'rotate-180')}
                />
              </button>

              {isSortOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsSortOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-40 w-56 bg-(--cat-surface) border border-(--cat-stone) rounded-md shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-150">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSortBy(opt.id);
                          setIsSortOpen(false);
                        }}
                        className={cn(
                          'w-full px-4 py-2 text-left font-hanken text-[12px] flex items-center justify-between cursor-pointer transition-colors',
                          sortBy === opt.id
                            ? 'bg-(--cat-surface-container) font-semibold text-(--cat-on-surface)'
                            : 'text-(--cat-on-surface-variant) hover:bg-(--cat-surface-container-low) hover:text-(--cat-on-surface)'
                        )}
                      >
                        <span>{opt.label}</span>
                        {sortBy === opt.id && <Check size={13} className="text-(--cat-charcoal)" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Active Filter Badges Bar */}
          {totalActiveFilters > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 animate-in fade-in duration-150">
              <span className="font-hanken text-[11px] uppercase tracking-[0.08em] text-(--cat-on-surface-variant) font-semibold mr-1">
                Filter:
              </span>

              {debouncedSearchQuery && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-(--cat-surface-container) border border-(--cat-stone) font-hanken text-[11px] text-(--cat-on-surface)">
                  <span>&quot;{debouncedSearchQuery}&quot;</span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="cursor-pointer text-(--cat-on-surface-variant) hover:text-(--cat-on-surface)"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}
              {selectedCategories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-(--cat-surface-container) border border-(--cat-stone) font-hanken text-[11px] text-(--cat-on-surface)"
                >
                  <span className="capitalize">{cat}</span>
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="cursor-pointer text-(--cat-on-surface-variant) hover:text-(--cat-on-surface)"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
              {productType !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-(--cat-surface-container) border border-(--cat-stone) font-hanken text-[11px] text-(--cat-on-surface)">
                  <span>
                    Tipe:{' '}
                    {productType === 'AVAILABLE'
                      ? 'Ready Stock'
                      : productType === 'PRE_ORDER'
                        ? 'Pre-Order'
                        : productType === 'COMING_SOON'
                          ? 'Segera Hadir'
                          : 'Arsip'}
                  </span>
                  <button
                    onClick={() => setProductType('ALL')}
                    className="cursor-pointer text-(--cat-on-surface-variant) hover:text-(--cat-on-surface)"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}
              {availability !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-(--cat-surface-container) border border-(--cat-stone) font-hanken text-[11px] text-(--cat-on-surface)">
                  <span>Ada Stok</span>
                  <button
                    onClick={() => setAvailability('ALL')}
                    className="cursor-pointer text-(--cat-on-surface-variant) hover:text-(--cat-on-surface)"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}
              {selectedColors.map((color) => {
                const colorObj = availableColors.find(
                  (c) => c.name.toLowerCase() === color.toLowerCase()
                );
                return (
                  <span
                    key={color}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-(--cat-surface-container) border border-(--cat-stone) font-hanken text-[11px] text-(--cat-on-surface)"
                  >
                    {colorObj?.hex && (
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: colorObj.hex }}
                      />
                    )}
                    <span className="capitalize">{color}</span>
                    <button
                      onClick={() => toggleColor(color)}
                      className="cursor-pointer text-(--cat-on-surface-variant) hover:text-(--cat-on-surface)"
                    >
                      <X size={11} />
                    </button>
                  </span>
                );
              })}
              {selectedSizes.map((size) => (
                <span
                  key={size}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-(--cat-surface-container) border border-(--cat-stone) font-hanken text-[11px] text-(--cat-on-surface)"
                >
                  <span>Size: {size}</span>
                  <button
                    onClick={() => toggleSize(size)}
                    className="cursor-pointer text-(--cat-on-surface-variant) hover:text-(--cat-on-surface)"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
              {selectedPriceRange !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-(--cat-surface-container) border border-(--cat-stone) font-hanken text-[11px] text-(--cat-on-surface)">
                  <span>{PRICE_RANGES.find((r) => r.id === selectedPriceRange)?.label}</span>
                  <button
                    onClick={() => setSelectedPriceRange('ALL')}
                    className="cursor-pointer text-(--cat-on-surface-variant) hover:text-(--cat-on-surface)"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-[11px] font-hanken font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) hover:text-(--cat-on-surface) underline cursor-pointer ml-1.5"
              >
                Reset Semua
              </button>
            </div>
          )}

          {/* Product Grid or Editorial Empty State */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 6} />
              ))}
            </div>
          ) : (
            <div className="py-16 md:py-24 px-4 flex flex-col items-center justify-center text-center max-w-lg mx-auto animate-in fade-in duration-200">
              <div className="w-14 h-14 mb-5 rounded-full bg-(--cat-surface-container) border border-(--cat-stone) flex items-center justify-center text-(--cat-on-surface-variant)">
                <SlidersHorizontal size={20} strokeWidth={1.5} />
              </div>

              <h3 className="font-eb-garamond text-[26px] md:text-[30px] font-normal tracking-tight text-(--cat-on-surface)">
                Tidak Ada Produk yang Sesuai
              </h3>

              <p className="mt-2 font-hanken text-[13px] md:text-[14px] text-(--cat-on-surface-variant) leading-relaxed max-w-md">
                Kombinasi filter yang Anda pilih saat ini tidak menemukan item. Silakan sesuaikan
                filter atau jelajahi koleksi lainnya.
              </p>

              {totalActiveFilters > 0 && (
                <div className="mt-7">
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="px-6 py-3 bg-(--cat-charcoal) text-white font-hanken text-[11px] font-semibold uppercase tracking-widest hover:opacity-90 cursor-pointer inline-flex items-center justify-center gap-2 transition-all active:scale-98"
                  >
                    <RotateCcw size={13} />
                    <span>Reset Semua Filter</span>
                  </button>
                </div>
              )}

              {/* Quick suggestions if categories exist */}
              {availableCategories.length > 0 && (
                <div className="mt-10 pt-8 border-t border-(--cat-stone) w-full">
                  <p className="font-hanken text-[11px] font-semibold uppercase tracking-widest text-(--cat-on-surface-variant)/70 mb-3">
                    Kategori Populer
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {availableCategories.slice(0, 5).map((cat) => (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => {
                          resetAllFilters();
                          setSelectedCategories([cat.name]);
                        }}
                        className="px-3.5 py-1.5 border border-(--cat-stone) text-(--cat-on-surface) font-hanken text-[12px] hover:border-(--cat-charcoal) hover:bg-(--cat-surface-container) transition-colors cursor-pointer capitalize"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer / Modal (Slide-in Sheet) */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end md:hidden animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-(--cat-surface) h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-(--cat-stone) pb-4">
                <div>
                  <h3 className="font-eb-garamond text-[24px] font-normal text-(--cat-on-surface)">
                    Filter & Cari
                  </h3>
                  <p className="text-[11px] font-hanken text-(--cat-on-surface-variant) tracking-[0.04em] uppercase">
                    {filteredProducts.length} produk ditemukan
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 text-(--cat-on-surface-variant) hover:text-(--cat-on-surface) cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {renderFilterSidebar()}
            </div>

            {/* Mobile Drawer Bottom Action */}
            <div className="pt-4 border-t border-(--cat-stone) mt-6 sticky bottom-0 bg-(--cat-surface) pb-2">
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-3.5 bg-(--cat-charcoal) text-white font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] shadow-sm cursor-pointer active:scale-99 transition-transform"
              >
                Terapkan Filter ({filteredProducts.length} Produk)
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
