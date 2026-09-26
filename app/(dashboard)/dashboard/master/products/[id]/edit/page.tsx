'use client';

import React, { use } from 'react';
import { useProducts } from '@/hooks/use-products';
import { ProductForm } from '@/components/dashboard/product-form';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CmsPageSkeleton } from '@/components/shared/cms-page-skeleton';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = use(params);
  const { data: products = [], isLoading } = useProducts();

  if (isLoading) {
    return <CmsPageSkeleton variant="form" />;
  }

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 gap-4 text-center">
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

  return <ProductForm initialProduct={product} />;
}
