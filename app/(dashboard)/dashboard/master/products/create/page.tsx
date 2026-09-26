import React from 'react';
import { ProductForm } from '@/components/dashboard/product-form';

export const metadata = {
  title: 'Tambah Model Kaos Baru | Dashboard RIO COLLECTION',
  description: 'Tambah produk kaos baru beserta galeri foto, spesifikasi bahan & perawatan, dan stok.'
};

export default function CreateProductPage() {
  return <ProductForm />;
}
