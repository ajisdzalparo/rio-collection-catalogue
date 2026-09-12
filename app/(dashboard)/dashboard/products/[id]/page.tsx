'use client';

import React, { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/use-products';
import { CMSBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatIDR, cn } from '@/lib/utils';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmModal } from '@/components/shared/confirm-modal';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { data: products = [], isLoading, deleteProduct } = useProducts();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium">Memuat detail produk...</p>
      </div>
    );
  }

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div>
          <h2 className="text-lg font-bold text-foreground">Produk Tidak Ditemukan</h2>
          <p className="text-xs text-muted-foreground">
            Produk dengan ID &quot;{id}&quot; tidak ditemukan dalam database.
          </p>
        </div>
        <Link href="/dashboard/products">
          <Button variant="outline" size="sm" className="rounded-xl cursor-pointer">
            Kembali ke Daftar Produk
          </Button>
        </Link>
      </div>
    );
  }

  // Image list compilation
  const detailUrls = (product.imageDetails ?? []).map((img) => img.url).filter(Boolean);
  const fallbackDetails = (product.images || []).filter((img) => img && img !== product.imageUrl);
  const allDetails = detailUrls.length > 0 ? detailUrls : fallbackDetails;
  const imagesList = Array.from(new Set([product.imageUrl, ...allDetails].filter(Boolean)));
  const activeImage = imagesList[activeImageIndex] || product.imageUrl || '/placeholder.png';

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? imagesList.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1));
  };

  const isAlwaysAvailable = product.stockMode === 'ALWAYS_AVAILABLE';
  const totalStock =
    product.stock ??
    product.variants.reduce((acc, v) => acc + (v.stock || (v.inStock ? 10 : 0)), 0);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteProduct(product.id);
      toast.success(`Produk "${product.name}" berhasil dihapus`);
      router.push('/dashboard/products');
    } catch {
      toast.error('Gagal menghapus produk');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getStatusBadge = () => {
    const isNeedsUpdate = product.status === 'AVAILABLE' && !isAlwaysAvailable && totalStock <= 0;
    if (isNeedsUpdate) return <CMSBadge variant="warning">STOK 0 (PERLU UPDATE)</CMSBadge>;
    if (product.status === 'SOLD_OUT') return <CMSBadge variant="error">SOLD OUT</CMSBadge>;
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
        return <Badge variant="outline">{product.status}</Badge>;
    }
  };

  const fabricText = product.materialsAndCare?.fabric || '-';

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/30 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/products">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl cursor-pointer"
              title="Kembali ke Daftar Produk"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">{product.name}</h1>
            <p className="text-xs text-muted-foreground">Detail spesifikasi & varian stok produk</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/dashboard/products/${product.id}/edit`}>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3.5 rounded-xl text-xs font-medium cursor-pointer gap-1.5"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Edit</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="h-9 px-3.5 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 border-destructive/30 cursor-pointer gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Hapus</span>
          </Button>
        </div>
      </div>

      {/* Main Grid Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Gallery (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-4/5 w-full max-h-[420px] max-w-md mx-auto overflow-hidden rounded-2xl bg-card border border-border/40 shadow-xs group transition-all duration-300">
            <Image
              src={activeImage}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-contain p-4 transition-transform duration-300 group-hover:scale-102"
              priority
            />

            {/* Carousel Navigation Arrows */}
            {imagesList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 hover:bg-background text-foreground border border-border/40 flex items-center justify-center backdrop-blur-md transition-all duration-200 cursor-pointer shadow-sm opacity-0 group-hover:opacity-100 active:scale-95"
                  title="Gambar Sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 hover:bg-background text-foreground border border-border/40 flex items-center justify-center backdrop-blur-md transition-all duration-200 cursor-pointer shadow-sm opacity-0 group-hover:opacity-100 active:scale-95"
                  title="Gambar Selanjutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <div className="absolute bottom-3 right-3 bg-background/80 border border-border/40 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono font-bold text-foreground rounded-full shadow-2xs select-none">
                  {activeImageIndex + 1} / {imagesList.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail list */}
          {imagesList.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto p-1 justify-center scrollbar-none">
              {imagesList.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={cn(
                    'relative w-16 aspect-4/5 shrink-0 overflow-hidden rounded-xl bg-card border p-1 transition-all duration-200 cursor-pointer',
                    activeImageIndex === idx
                      ? 'border-primary ring-2 ring-primary/20 shadow-sm opacity-100 scale-105'
                      : 'border-border/40 opacity-60 hover:opacity-100 hover:border-border'
                  )}
                >
                  <Image
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    fill
                    sizes="64px"
                    className="object-contain p-0.5 rounded-lg"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Information & Specs (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Attributes Header */}
          <div className="space-y-3 bg-card border border-border/40 rounded-2xl p-5">
            <div className="flex flex-wrap items-center gap-2">
              {getStatusBadge()}
              {product.edition && (
                <Badge variant="outline" className="text-xs font-semibold rounded-lg px-2.5 py-0.5">
                  {product.edition}
                </Badge>
              )}
              {product.category && (
                <span className="text-xs font-medium text-muted-foreground bg-muted/40 px-2.5 py-0.5 rounded-lg border border-border/30">
                  {product.category}
                </span>
              )}
            </div>

            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
              {product.name}
            </h2>

            <div className="text-xl font-bold text-foreground tabular-nums">
              {formatIDR(product.price)}
              {product.hpp ? (
                <span className="text-xs text-muted-foreground font-normal ml-2">
                  (HPP: {formatIDR(product.hpp)})
                </span>
              ) : null}
            </div>

            {product.description && (
              <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border/20">
                {product.description}
              </p>
            )}
          </div>

          {/* Key Specifications Grid */}
          <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Spesifikasi Produk
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground text-[11px]">Bahan / Fabric</span>
                <p className="font-semibold text-foreground">{fabricText}</p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground text-[11px]">Warna Utama</span>
                <p className="font-semibold text-foreground">{product.color || '-'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground text-[11px]">Edisi Collection</span>
                <p className="font-semibold text-foreground">{product.edition || '-'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground text-[11px]">Mode Manajemen Stok</span>
                <p className="font-semibold text-foreground">
                  {isAlwaysAvailable ? 'Selalu Tersedia (Pre-Order)' : 'Kuantitas Stok Spesifik'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground text-[11px]">Total Stok Keseluruhan</span>
                <p className="font-semibold text-foreground">
                  {isAlwaysAvailable ? '∞ (Unlimited)' : `${totalStock} Pcs`}
                </p>
              </div>
            </div>
          </div>

          {/* Variants & Sizes Table */}
          <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Varian Ukuran & Stok
              </h3>
              <span className="text-xs text-muted-foreground">
                {product.variants.length} Ukuran Didaftarkan
              </span>
            </div>

            <div className="border border-border/30 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/30">
                    <th className="py-2.5 px-4">Ukuran</th>
                    <th className="py-2.5 px-4">Jumlah Stok</th>
                    <th className="py-2.5 px-4 text-right">Status Varian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {product.variants.map((v) => {
                    const stockQty = v.stock ?? (v.inStock ? 10 : 0);
                    const isVAvailable = isAlwaysAvailable || (v.inStock && stockQty > 0);
                    return (
                      <tr key={v.size} className="hover:bg-muted/20">
                        <td className="py-3 px-4 font-bold text-foreground">{v.size}</td>
                        <td className="py-3 px-4 tabular-nums font-semibold text-foreground">
                          {isAlwaysAvailable ? '∞ (Ready)' : `${stockQty} Pcs`}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isVAvailable ? (
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              Tersedia
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-rose-500">Habis</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDelete}
        title="Hapus Produk Ini?"
        description={`Apakah Anda yakin ingin menghapus produk "${product.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Produk"
        variant="destructive"
        loading={isDeleting}
      />
    </div>
  );
}
