'use client';

import React, { useState, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Plus,
  Edit,
  Layers,
  Trash2,
  Eye,
  Package,
  AlertCircle,
  X,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/hooks/use-products';
import { useMasterStore } from '@/hooks/use-master-data';
import { VStack, Flex } from '@/components/ui/layout';
import { DataTable, type Column } from '@/components/shared/data-table/data-table';
import { TruncatedText } from '@/components/ui/truncated-text';
import { SafeImage, CMSBadge } from '@/components/shared';
import { formatIDR } from '@/lib/utils';
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
import type { Product } from '@/types/catalogue.types';

const PRODUCT_STATUS_OPTIONS = [
  { id: 'AVAILABLE', label: 'Ready Stock' },
  { id: 'SOLD_OUT', label: 'Sold Out' },
  { id: 'COMING_SOON', label: 'Coming Soon' },
  { id: 'PRE_ORDER', label: 'Pre-Order' }
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const filterParam = searchParams.get('filter');
  const isOutOfStockFilter = filterParam === 'out_of_stock';

  const { data: products = [], isLoading: loading, deleteProduct, isDeleting } = useProducts();

  // Master data
  const { categories } = useMasterStore();

  // Applied Filters (used to filter the data table)
  const [appliedCategories, setAppliedCategories] = useState<string[]>([]);
  const [appliedStatuses, setAppliedStatuses] = useState<string[]>([]);

  // Draft Filters (used inside the filter drawer before clicking Terapkan)
  const [draftCategories, setDraftCategories] = useState<string[]>([]);
  const [draftStatuses, setDraftStatuses] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  const categoryOptions: MultiSelectOption[] = useMemo(() => {
    return categories.map((cat) => ({
      value: cat.slug,
      label: cat.name
    }));
  }, [categories]);

  const statusOptions: MultiSelectOption[] = useMemo(() => {
    return PRODUCT_STATUS_OPTIONS.map((opt) => ({
      value: opt.id,
      label: opt.label
    }));
  }, []);

  const handleOpenFilterDrawer = (open: boolean) => {
    if (open) {
      setDraftCategories(appliedCategories);
      setDraftStatuses(appliedStatuses);
    }
    setIsFilterOpen(open);
  };

  const handleApplyFilters = () => {
    setAppliedCategories(draftCategories);
    setAppliedStatuses(draftStatuses);
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    setDraftCategories([]);
    setDraftStatuses([]);
    setAppliedCategories([]);
    setAppliedStatuses([]);
    setIsFilterOpen(false);
  };

  const activeFilterCount = appliedCategories.length + appliedStatuses.length;

  const [deleteTargetProduct, setDeleteTargetProduct] = useState<Product | null>(null);

  const confirmDeleteProduct = async () => {
    if (!deleteTargetProduct) return;
    try {
      await deleteProduct(deleteTargetProduct.id);
      toast.success(`Produk "${deleteTargetProduct.name}" berhasil dihapus`);
    } catch (err) {
      console.error('Failed to delete product:', err);
      toast.error('Gagal menghapus produk');
    } finally {
      setDeleteTargetProduct(null);
    }
  };

  const getStatusBadge = useCallback((product: Product) => {
    const isAlwaysAvailable = product.stockMode === 'ALWAYS_AVAILABLE';
    const totalStock =
      product.stock ??
      product.variants.reduce((acc, v) => acc + (v.stock || (v.inStock ? 10 : 0)), 0);

    const isNeedsUpdate = product.status === 'AVAILABLE' && !isAlwaysAvailable && totalStock <= 0;

    if (isNeedsUpdate) {
      return <CMSBadge variant="warning">STOK 0 (PERLU UPDATE)</CMSBadge>;
    }

    if (product.status === 'SOLD_OUT') {
      return <CMSBadge variant="error">SOLD OUT</CMSBadge>;
    }

    switch (product.status) {
      case 'AVAILABLE':
        return (
          <CMSBadge variant="success">
            {isAlwaysAvailable ? 'ALWAYS READY' : 'READY STOCK'}
          </CMSBadge>
        );
      case 'COMING_SOON':
        return <CMSBadge variant="neutral">COMING SOON</CMSBadge>;
      case 'PRE_ORDER':
        return <CMSBadge variant="warning">PRE-ORDER</CMSBadge>;
      default:
        return (
          <Badge variant="outline" className="font-semibold px-2.5 py-0.5 rounded-full text-[10px]">
            {product.status}
          </Badge>
        );
    }
  }, []);

  // Filter products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        appliedCategories.length === 0 || appliedCategories.includes(p.category);
      const matchesStatus = appliedStatuses.length === 0 || appliedStatuses.includes(p.status);

      const totalStock =
        p.stock ?? p.variants.reduce((acc, v) => acc + (v.stock || (v.inStock ? 10 : 0)), 0);

      const matchesOutOfStockFilter =
        !isOutOfStockFilter ||
        (p.status === 'AVAILABLE' && p.stockMode === 'QUANTITY' && totalStock <= 0);

      return matchesCategory && matchesStatus && matchesOutOfStockFilter;
    });
  }, [products, appliedCategories, appliedStatuses, isOutOfStockFilter]);

  // Table Columns Definition for DataTable
  const columns: Column<Product>[] = useMemo(
    () => [
      {
        header: 'Foto',
        cell: (product) => (
          <Link href={`/dashboard/products/${product.id}`}>
            <div className="relative h-12 w-10 overflow-hidden bg-muted/50 border border-border/20 rounded-md shrink-0 cursor-pointer hover:opacity-85 transition-opacity">
              <SafeImage
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
          </Link>
        )
      },
      {
        header: 'Nama Kaos',
        accessorKey: 'name',
        sortable: true,
        className: 'w-full min-w-[180px]',
        cell: (product) => (
          <Link href={`/dashboard/products/${product.id}`} className="flex flex-col text-xs max-w-50 group">
            <TruncatedText
              text={product.name}
              maxWidth="max-w-[180px]"
              className="font-bold text-foreground group-hover:text-primary transition-colors"
            />
            <TruncatedText
              text={product.color}
              maxWidth="max-w-[150px]"
              className="text-[10px] text-muted-foreground font-normal"
            />
          </Link>
        )
      },
      {
        header: 'Kategori & Edisi',
        accessorKey: 'category',
        sortable: true,
        cell: (product) => (
          <div className="space-y-1 text-xs max-w-45">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md border border-border/10">
              <Layers className="h-3 w-3 shrink-0" />
              <TruncatedText
                text={product.category.replace('-', ' ')}
                maxWidth="max-w-[120px]"
                className="capitalize"
              />
            </span>
            <TruncatedText
              text={product.edition}
              maxWidth="max-w-[150px]"
              className="text-[10px] text-muted-foreground font-medium"
            />
          </div>
        )
      },
      {
        header: 'Harga',
        accessorKey: 'price',
        sortable: true,
        className: 'font-bold text-xs',
        cell: (product) => (
          <div className="flex flex-col text-xs">
            <span className="font-extrabold text-foreground">{formatIDR(product.price)}</span>
            {product.hpp ? (
              <span className="text-[10px] text-muted-foreground font-normal">
                HPP: {formatIDR(product.hpp)}
              </span>
            ) : null}
          </div>
        )
      },
      {
        header: 'Status',
        accessorKey: 'status',
        sortable: true,
        cell: (product) => getStatusBadge(product)
      },
      {
        header: 'Aksi',
        className: 'text-right',
        cell: (product) => (
          <div className="flex items-center justify-end gap-1">
            <Link href={`/dashboard/products/${product.id}`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Lihat Detail Produk & Stok"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}
              className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Edit Detail Produk"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteTargetProduct(product)}
              disabled={isDeleting}
              className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              title="Hapus Produk"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      }
    ],
    [getStatusBadge, isDeleting, router]
  );

  // Mobile Adaptive Card Renderer for Products
  const renderProductCard = useCallback(
    (product: Product) => {
      return (
        <div className="p-3.5 sm:p-4 rounded-lg border border-border/70 bg-card/90 shadow-2xs backdrop-blur-md flex flex-col gap-3 transition-all hover:border-border">
          {/* Top: Image + Info */}
          <div className="flex items-start gap-3">
            <Link href={`/dashboard/products/${product.id}`} className="relative h-20 w-16 rounded-md overflow-hidden bg-muted/50 border border-border/30 shrink-0 shadow-xs">
              <SafeImage
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="70px"
                className="object-cover"
              />
            </Link>

            <div className="flex-1 min-w-0 space-y-1">
              <Link href={`/dashboard/products/${product.id}`}>
                <h3 className="text-xs sm:text-sm font-bold text-foreground line-clamp-1 leading-snug hover:text-primary transition-colors">
                  {product.name}
                </h3>
              </Link>

              <p className="text-[11px] text-muted-foreground font-medium truncate">
                {product.color}
              </p>

              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/20">
                  <Layers className="h-2.5 w-2.5" />
                  <span className="capitalize">{product.category.replace('-', ' ')}</span>
                </span>
                {product.edition && (
                  <span className="text-[9px] font-medium text-muted-foreground">
                    {product.edition}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Middle: Price, HPP & Status */}
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/25 border border-border/20">
            <div>
              <span className="text-[9px] text-muted-foreground block font-bold uppercase tracking-wider">
                Harga Jual
              </span>
              <span className="text-xs font-bold text-foreground">{formatIDR(product.price)}</span>
              {product.hpp ? (
                <span className="text-[9px] text-muted-foreground block">
                  HPP: {formatIDR(product.hpp)}
                </span>
              ) : null}
            </div>

            <div className="text-right">
              <span className="text-[9px] text-muted-foreground block font-bold uppercase tracking-wider mb-0.5">
                Status
              </span>
              <div>{getStatusBadge(product)}</div>
            </div>
          </div>

          {/* Bottom Actions Bar */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/30">
            <div className="flex items-center gap-1.5 flex-1">
              <Link href={`/dashboard/products/${product.id}`} className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs font-semibold rounded-xl gap-1 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Detail</span>
                </Button>
              </Link>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}
                className="flex-1 h-8 text-xs font-bold rounded-xl gap-1 cursor-pointer bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Edit</span>
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTargetProduct(product)}
              disabled={isDeleting}
              className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer shrink-0"
              title="Hapus Produk"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    },
    [router, isDeleting, getStatusBadge]
  );

  return (
    <VStack gap="lg" className="pb-10">
      <Flex direction="responsive" justify="between" align="center" gap="md">
        <VStack gap="xs">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Katalog Produk Kaos
          </h1>
          <p className="text-sm text-muted-foreground pt-1">
            Kelola detail katalog kaos (harga, HPP, edisi, kategori, spesifikasi bahan, dan galeri
            foto).
          </p>
        </VStack>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Link href="/dashboard/stock" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto gap-2 h-10 rounded-xl cursor-pointer font-bold text-xs"
            >
              <Package className="h-4 w-4 text-primary" />
              <span>Manajemen Stok</span>
            </Button>
          </Link>
          <Link href="/dashboard/products/create" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto gap-2 h-10 rounded-xl cursor-pointer font-bold uppercase tracking-wider text-xs shadow-sm">
              <Plus className="h-4 w-4" />
              <span>Tambah Kaos Baru</span>
            </Button>
          </Link>
        </div>
      </Flex>

      {isOutOfStockFilter && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-lg flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-500">
                Filter: Produk Perlu Tindakan ({filteredProducts.length} Produk)
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Menampilkan produk aktif yang stoknya habis (0 pcs). Silakan klik ikon Edit (pensil)
                pada produk di bawah ini untuk mengisikan stok baru atau mengubah statusnya menjadi
                SOLD OUT.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/products')}
            className="h-8 text-xs font-bold rounded-md gap-1.5 cursor-pointer border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
          >
            <X className="h-3.5 w-3.5" />
            <span>Lihat Semua Produk</span>
          </Button>
        </div>
      )}

      {/* Products DataTable with Adaptive Mobile Card View */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        isLoading={loading}
        searchKey="name"
        searchPlaceholder="Cari nama kaos, edisi, deskripsi..."
        renderCard={renderProductCard}
        filterComponents={
          <Sheet open={isFilterOpen} onOpenChange={handleOpenFilterDrawer}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 sm:h-9 gap-2 rounded-lg text-xs font-medium cursor-pointer"
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
                    <span>Filter Katalog Kaos</span>
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
                  Saring katalog kaos berdasarkan kategori dan status ketersediaan.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 py-5">
                {/* Category Multi-Filter Section */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Kategori Kaos</Label>
                  <MultiSelect
                    options={categoryOptions}
                    value={draftCategories}
                    onChange={setDraftCategories}
                    placeholder="Semua Kategori"
                    searchPlaceholder="Cari kategori..."
                    emptyText="Kategori tidak ditemukan"
                  />
                </div>

                {/* Status Multi-Filter Section */}
                <div className="space-y-1.5 pt-3 border-t border-border/20">
                  <Label className="text-xs font-bold text-foreground">Status Produk</Label>
                  <MultiSelect
                    options={statusOptions}
                    value={draftStatuses}
                    onChange={setDraftStatuses}
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
        emptyTitle="Produk Tidak Ditemukan"
        emptyDescription="Tidak ada data katalog kaos yang cocok dengan filter atau pencarian Anda."
        pageSize={10}
      />

      <ConfirmModal
        open={Boolean(deleteTargetProduct)}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetProduct(null);
        }}
        title="Konfirmasi Hapus Produk"
        description={
          deleteTargetProduct
            ? `Apakah Anda yakin ingin menghapus produk "${deleteTargetProduct.name}" dari CMS?`
            : ''
        }
        confirmText="Hapus Produk"
        cancelText="Batal"
        variant="destructive"
        loading={isDeleting}
        onConfirm={confirmDeleteProduct}
      />
    </VStack>
  );
}

export default function ProductsCmsPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-xs text-muted-foreground">Memuat data produk...</div>}
    >
      <ProductsContent />
    </Suspense>
  );
}
