'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { SlidersHorizontal, RotateCcw, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { VStack, Flex } from '@/components/ui/layout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import { DataTable, type Column } from '@/components/shared/data-table/data-table';
import { useRbac } from '@/features/users/hooks/use-rbac';
import { useSizesQuery } from '@/hooks/use-master-data';
import { sortSizes } from '@/lib/size-sorter';

interface Variant {
  id: string;
  size: string;
  stock: number;
  inStock: boolean;
}

interface StockProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  color: string;
  price: number;
  stock: number;
  stockMode: 'QUANTITY' | 'ALWAYS_AVAILABLE';
  status: 'AVAILABLE' | 'SOLD_OUT' | 'COMING_SOON';
  imageUrl: string;
  variants: Variant[];
}

const STOCK_MODE_OPTIONS = [
  { id: 'ALWAYS_AVAILABLE', label: 'Selalu Tersedia (Pre-Order)' },
  { id: 'IN_STOCK', label: 'Ready Stock' },
  { id: 'SOLD_OUT', label: 'Stok Habis (0 Pcs)' }
];

export default function StockManagementPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useRbac();
  const canManageStock = hasPermission('stock.manage');
  // Applied Filters (used to filter the stock table)
  const [appliedCategories, setAppliedCategories] = useState<string[]>([]);
  const [appliedStockModes, setAppliedStockModes] = useState<string[]>([]);

  // Draft Filters (used inside the filter drawer before clicking Terapkan)
  const [draftCategories, setDraftCategories] = useState<string[]>([]);
  const [draftStockModes, setDraftStockModes] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  const [editingProduct, setEditingProduct] = useState<StockProduct | null>(null);
  const [variantDrafts, setVariantDrafts] = useState<
    Record<string, { stock: number; inStock: boolean }>
  >({});
  const [stockModeDraft, setStockModeDraft] = useState<'QUANTITY' | 'ALWAYS_AVAILABLE'>('QUANTITY');

  // Master Sizes from DB
  const { data: masterSizes = [] } = useSizesQuery();
  const activeMasterSizes = useMemo(() => {
    return masterSizes.filter((s) => s.isActive && !s.deletedAt);
  }, [masterSizes]);

  const sortedActiveSizes = useMemo(() => {
    return sortSizes(activeMasterSizes, (s) => s.size);
  }, [activeMasterSizes]);

  const activeSizeNames = useMemo(
    () => new Set(activeMasterSizes.map((s) => s.size)),
    [activeMasterSizes]
  );

  // Fetch products
  const { data: products = [], isLoading } = useQuery<StockProduct[]>({
    queryKey: ['admin-stock-products'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/products');
      return data.data || [];
    }
  });

  // Mutation to update stock variants
  const updateStockMutation = useMutation({
    mutationFn: async ({
      productId,
      stockMode,
      variants
    }: {
      productId: string;
      stockMode: string;
      variants: Array<{ size: string; stock: number; inStock: boolean }>;
    }) => {
      const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
      const { data } = await axios.put(`/api/v1/products/${productId}`, {
        stockMode,
        stock: totalStock,
        variants
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stock-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Stok produk berhasil diperbarui');
      setEditingProduct(null);
    },
    onError: (error: unknown) => {
      console.error('Failed to update stock:', error);
      toast.error('Gagal memperbarui stok produk');
    }
  });

  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  const categoryOptions: MultiSelectOption[] = useMemo(() => {
    return categories.map((cat) => ({
      value: cat,
      label: cat
    }));
  }, [categories]);

  const stockModeOptions: MultiSelectOption[] = useMemo(() => {
    return STOCK_MODE_OPTIONS.map((opt) => ({
      value: opt.id,
      label: opt.label
    }));
  }, []);

  const handleOpenFilterDrawer = (open: boolean) => {
    if (open) {
      setDraftCategories(appliedCategories);
      setDraftStockModes(appliedStockModes);
    }
    setIsFilterOpen(open);
  };

  const handleApplyFilters = () => {
    setAppliedCategories(draftCategories);
    setAppliedStockModes(draftStockModes);
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    setDraftCategories([]);
    setDraftStockModes([]);
    setAppliedCategories([]);
    setAppliedStockModes([]);
    setIsFilterOpen(false);
  };

  const activeFilterCount = appliedCategories.length + appliedStockModes.length;

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      appliedCategories.length === 0 || appliedCategories.includes(product.category);

    let matchesMode = true;
    if (appliedStockModes.length > 0) {
      const isAlways = product.stockMode === 'ALWAYS_AVAILABLE';
      const isReady = isAlways || product.stock > 0;
      const isSoldOut = product.stockMode === 'QUANTITY' && product.stock === 0;

      matchesMode = appliedStockModes.some((mode) => {
        if (mode === 'ALWAYS_AVAILABLE') return isAlways;
        if (mode === 'IN_STOCK') return isReady;
        if (mode === 'SOLD_OUT') return isSoldOut;
        return false;
      });
    }

    return matchesCategory && matchesMode;
  });

  // Analytics stats
  const totalProducts = products.length;
  const inStockCount = products.filter(
    (p) => p.stockMode === 'ALWAYS_AVAILABLE' || p.stock > 0
  ).length;
  const lowStockCount = products.filter(
    (p) => p.stockMode === 'QUANTITY' && p.stock > 0 && p.stock <= 5
  ).length;
  const soldOutCount = products.filter((p) => p.stockMode === 'QUANTITY' && p.stock === 0).length;

  const handleOpenEdit = (product: StockProduct) => {
    setEditingProduct(product);
    setStockModeDraft(product.stockMode);

    const existingMap = new Map(product.variants.map((v) => [v.size, v]));
    const drafts: Record<string, { stock: number; inStock: boolean }> = {};

    activeMasterSizes.forEach((ms) => {
      const existing = existingMap.get(ms.size);
      if (existing) {
        drafts[ms.size] = { stock: existing.stock, inStock: existing.inStock };
      } else {
        drafts[ms.size] = { stock: 0, inStock: false };
      }
    });

    setVariantDrafts(drafts);
  };

  const handleSaveStock = () => {
    if (!editingProduct || !canManageStock) return;
    const variantsPayload = sortSizes(
      Object.entries(variantDrafts)
        .filter(([size]) => activeSizeNames.has(size))
        .map(([size, item]) => ({
          size,
          stock: item.stock,
          inStock: item.inStock
        })),
      (v) => v.size
    );

    updateStockMutation.mutate({
      productId: editingProduct.id,
      stockMode: stockModeDraft,
      variants: variantsPayload
    });
  };

  const stockColumns: Column<StockProduct>[] = [
    {
      header: 'Produk',
      accessorKey: 'name',
      sortable: true,
      className: 'min-w-[220px]',
      cell: (product) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-muted/20 border border-border/40 overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl || '/placeholder.png'}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 space-y-0.5">
            <p className="font-medium text-xs text-foreground truncate">{product.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {product.category} · {product.color}
            </p>
          </div>
        </div>
      )
    },
    {
      header: 'Mode Stok',
      accessorKey: 'stockMode',
      sortable: true,
      className: 'w-32',
      cell: (product) => {
        const isAlwaysAvailable = product.stockMode === 'ALWAYS_AVAILABLE';
        return (
          <span className="text-xs text-muted-foreground">
            {isAlwaysAvailable ? 'Selalu Ada' : 'Kuantitas'}
          </span>
        );
      }
    },
    {
      header: 'Varian Ukuran & Stok',
      className: 'min-w-[260px]',
      cell: (product) => {
        const isAlwaysAvailable = product.stockMode === 'ALWAYS_AVAILABLE';
        const displayedVariants = sortSizes(
          (product.variants || []).filter((v) => activeSizeNames.has(v.size)),
          (v) => v.size
        );

        if (displayedVariants.length === 0) {
          return (
            <span className="text-xs text-muted-foreground/60 italic">Tidak ada varian aktif</span>
          );
        }

        return (
          <div className="flex flex-wrap gap-1.5">
            {displayedVariants.map((v) => {
              const isAvailable = isAlwaysAvailable || (v.inStock && v.stock > 0);
              return (
                <div
                  key={v.id || v.size}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] ${
                    isAvailable
                      ? 'border-border/40 bg-muted/20 text-foreground'
                      : 'border-border/20 bg-muted/10 text-muted-foreground/50 line-through'
                  }`}
                >
                  <span className="uppercase font-mono">{v.size}:</span>
                  <span>{isAlwaysAvailable ? '∞' : v.stock}</span>
                </div>
              );
            })}
          </div>
        );
      }
    },
    {
      header: 'Total Stok',
      accessorKey: 'stock',
      sortable: true,
      className: 'w-28 text-center',
      cell: (product) => {
        const isAlwaysAvailable = product.stockMode === 'ALWAYS_AVAILABLE';
        return (
          <span className="font-medium text-xs text-foreground">
            {isAlwaysAvailable ? '∞ Selalu Ada' : `${product.stock} Pcs`}
          </span>
        );
      }
    },
    {
      header: 'Aksi',
      className: 'text-right w-20',
      cell: (product) => (
        <div className="flex justify-end">
          <Button
            onClick={() => handleOpenEdit(product)}
            variant="link"
            size="icon"
            disabled={!canManageStock}
            className="h-8 w-8 cursor-pointer"
            title={canManageStock ? 'Edit Stok' : 'Tidak memiliki akses kelola stok'}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <VStack gap="lg" className="pb-12">
      <Flex direction="responsive" justify="between" align="center" gap="md">
        <VStack gap="xs">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Manajemen Stok</h1>
          <p className="text-xs text-muted-foreground">
            Kelola kuantitas stok varian ukuran dan mode ketersediaan produk.
          </p>
        </VStack>
      </Flex>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border/40 bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Total Produk</p>
          <p className="text-xl font-bold text-foreground">{totalProducts}</p>
        </div>

        <div className="rounded-lg border border-border/40 bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Tersedia (In-Stock)</p>
          <p className="text-xl font-bold text-foreground">{inStockCount}</p>
        </div>

        <div className="rounded-lg border border-border/40 bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Stok Menipis (≤5)</p>
          <p className="text-xl font-bold text-foreground">{lowStockCount}</p>
        </div>

        <div className="rounded-lg border border-border/40 bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Stok Habis (Sold Out)</p>
          <p className="text-xl font-bold text-foreground">{soldOutCount}</p>
        </div>
      </div>

      {/* Products Stock Table */}
      <DataTable
        columns={stockColumns}
        data={filteredProducts}
        isLoading={isLoading}
        searchKey="name"
        extraSearchKeys={['color', 'category']}
        searchPlaceholder="Cari nama produk, warna, atau kategori..."
        emptyTitle="Tidak ada produk"
        emptyDescription="Coba ubah kata kunci pencarian atau filter kriteria Anda."
        pageSize={10}
        filterComponents={
          <Sheet open={isFilterOpen} onOpenChange={handleOpenFilterDrawer}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  className="h-10 sm:h-9 px-3.5 gap-2 rounded-lg text-xs font-medium cursor-pointer border-border/60 bg-card/60 shadow-2xs hover:bg-muted"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Filter</span>
                  {activeFilterCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              }
            />
            <SheetContent side="right">
              <SheetHeader className="border-b border-border/30 pb-4 pr-8">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-sm font-bold flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>Filter Data Stok</span>
                  </SheetTitle>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Reset All</span>
                    </button>
                  )}
                </div>
                <SheetDescription className="text-xs text-muted-foreground mt-1">
                  Saring data stok berdasarkan kategori produk dan ketersediaan barang.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 py-5">
                {/* Category Multi-Filter Section */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Kategori Produk</Label>
                  <MultiSelect
                    options={categoryOptions}
                    value={draftCategories}
                    onChange={setDraftCategories}
                    placeholder="Semua Kategori"
                    searchPlaceholder="Cari kategori..."
                    emptyText="Kategori tidak ditemukan"
                  />
                </div>

                {/* Stock Mode Multi-Filter Section */}
                <div className="space-y-1.5 pt-3 border-t border-border/20">
                  <Label className="text-xs font-bold text-foreground">Status Ketersediaan</Label>
                  <MultiSelect
                    options={stockModeOptions}
                    value={draftStockModes}
                    onChange={setDraftStockModes}
                    placeholder="Semua Status"
                    searchPlaceholder="Cari status..."
                    emptyText="Status tidak ditemukan"
                  />
                </div>
              </div>

              <SheetFooter className="border-t border-border/30 pt-4 flex flex-row items-center justify-end gap-2.5">
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="h-8 text-xs font-medium rounded-xl cursor-pointer gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </Button>
                <Button
                  onClick={handleApplyFilters}
                  className="h-8 text-xs font-medium rounded-xl cursor-pointer"
                >
                  Terapkan Filter
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        }
      />

      {/* Edit Stock Modal */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="max-w-lg bg-card border-border/40 rounded-xl">
          <DialogHeader className="border-b border-border/20 pb-3">
            <DialogTitle className="text-sm font-bold">
              Edit Stok — {editingProduct?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Atur kuantitas stok per ukuran dan mode ketersediaan.
            </DialogDescription>
          </DialogHeader>

          {editingProduct && (
            <div className="space-y-4 py-3">
              {/* Stock Mode Switcher */}
              <div className="rounded-lg border border-border/40 bg-muted/20 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-semibold text-foreground">
                      Mode Stok Selalu Tersedia
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Aktifkan jika barang selalu ada (Pre-Order / Always Available).
                    </p>
                  </div>
                  <Switch
                    checked={stockModeDraft === 'ALWAYS_AVAILABLE'}
                    onCheckedChange={(checked) =>
                      setStockModeDraft(checked ? 'ALWAYS_AVAILABLE' : 'QUANTITY')
                    }
                  />
                </div>
              </div>

              {/* Variant Stock Editors */}
              {stockModeDraft === 'QUANTITY' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Kuantitas Stok Per Ukuran
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      {sortedActiveSizes.length} ukuran aktif di Master
                    </span>
                  </div>

                  {sortedActiveSizes.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                      Belum ada ukuran aktif di Master Ukuran. Silakan aktifkan ukuran terlebih
                      dahulu di menu Master Data.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {sortedActiveSizes.map((masterSize) => {
                        const sizeName = masterSize.size;
                        const current = variantDrafts[sizeName] || {
                          stock: 0,
                          inStock: false
                        };

                        return (
                          <div
                            key={sizeName}
                            className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-card p-2.5"
                          >
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-0.5 rounded border border-border/40 font-mono text-xs font-bold uppercase bg-muted/30 text-foreground">
                                {sizeName}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <Switch
                                  checked={current.inStock}
                                  onCheckedChange={(checked) =>
                                    setVariantDrafts((prev) => ({
                                      ...prev,
                                      [sizeName]: { ...current, inStock: checked }
                                    }))
                                  }
                                />
                                <span className="text-[11px] text-muted-foreground">
                                  {current.inStock ? 'Aktif' : 'Non-aktif'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={current.stock <= 0}
                                onClick={() =>
                                  setVariantDrafts((prev) => ({
                                    ...prev,
                                    [sizeName]: {
                                      ...current,
                                      stock: Math.max(0, current.stock - 1)
                                    }
                                  }))
                                }
                                className="h-7 w-7 p-0 rounded cursor-pointer font-bold text-xs"
                              >
                                -
                              </Button>

                              <Input
                                type="number"
                                min={0}
                                value={current.stock}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  setVariantDrafts((prev) => ({
                                    ...prev,
                                    [sizeName]: {
                                      ...current,
                                      stock: isNaN(val) ? 0 : Math.max(0, val)
                                    }
                                  }));
                                }}
                                className="w-16 h-7 text-center font-bold text-xs rounded"
                              />

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setVariantDrafts((prev) => ({
                                    ...prev,
                                    [sizeName]: { ...current, stock: current.stock + 1 }
                                  }))
                                }
                                className="h-7 w-7 p-0 rounded cursor-pointer font-bold text-xs"
                              >
                                +
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t border-border/20 pt-3">
            <Button
              variant="outline"
              onClick={() => setEditingProduct(null)}
              className="h-8 text-xs font-medium rounded cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveStock}
              disabled={updateStockMutation.isPending}
              className="h-8 text-xs font-medium rounded cursor-pointer"
            >
              {updateStockMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </VStack>
  );
}
