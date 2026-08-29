'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Product, StockMode } from '@/types/catalogue.types';
import axios from 'axios';

async function fetchProducts(): Promise<Product[]> {
  const { data } = await axios.get('/api/v1/products');
  let prods: Product[] = [];
  if (data.code === 200 && data.data) {
    prods = data.data;
  } else if (Array.isArray(data)) {
    prods = data;
  } else {
    throw new Error('Invalid products data received');
  }

  return prods.map((p) => {
    const stockMode: StockMode = p.stockMode ?? 'QUANTITY';

    const variants = (p.variants || []).map((v) => {
      const stock = v.stock ?? (v.inStock ? 10 : 0);
      return {
        ...v,
        stock,
        inStock: stockMode === 'ALWAYS_AVAILABLE' ? true : stock > 0
      };
    });

    const totalStock = p.stock ?? variants.reduce((sum, v) => sum + (v.stock || 0), 0);

    let status = p.status;
    if (stockMode === 'ALWAYS_AVAILABLE') {
      if (status !== 'SOLD_OUT' && status !== 'COMING_SOON') {
        status = 'AVAILABLE';
      }
    } else {
      if (totalStock === 0 && status === 'AVAILABLE') {
        status = 'SOLD_OUT';
      }
    }

    return {
      ...p,
      hpp: p.hpp ?? Math.round(p.price * 0.4),
      stock: totalStock,
      stockMode,
      status,
      variants,
      materialsAndCare: p.materialsAndCare
    };
  });
}

export function useProducts() {
  const queryClient = useQueryClient();

  const query = useQuery<Product[], Error>({
    queryKey: ['products'],
    queryFn: fetchProducts
  });

  const createMutation = useMutation({
    mutationFn: async (newProduct: Product) => {
      const { data } = await axios.post('/api/v1/products', newProduct);
      return data.data || newProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedProduct: Product) => {
      const { data } = await axios.put(`/api/v1/products/${updatedProduct.id}`, updatedProduct);
      return data.data || updatedProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/v1/products/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  return {
    ...query,
    createProduct: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateProduct: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteProduct: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  };
}
