'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Product, StockMode } from '@/types/catalogue.types';
import axios from 'axios';
import { env } from '@/config/env';

async function fetchProducts(): Promise<Product[]> {
  const { data } = await axios.get(`${env.velomockUrl}/api/v1/products`);
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
      await new Promise((resolve) => setTimeout(resolve, 300));
      return newProduct;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Product[]>(['products'], (old) => {
        if (!old) return [data];
        return [data, ...old];
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedProduct: Product) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return updatedProduct;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Product[]>(['products'], (old) => {
        if (!old) return [];
        return old.map((p) => (p.id === data.id ? data : p));
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return id;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Product[]>(['products'], (old) => {
        if (!old) return [];
        return old.filter((p) => p.id !== data);
      });
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
