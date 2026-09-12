'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Product, ProductMutationInput } from '@/types/catalogue.types';
import { normalizeProductAvailability } from '@/lib/product-availability';
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

  return prods.map(normalizeProductAvailability);
}

export function useProducts() {
  const queryClient = useQueryClient();

  const query = useQuery<Product[], Error>({
    queryKey: ['products'],
    queryFn: fetchProducts
  });

  const createMutation = useMutation({
    mutationFn: async (newProduct: ProductMutationInput) => {
      const { data } = await axios.post('/api/v1/products', newProduct);
      return data.data || newProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedProduct: ProductMutationInput) => {
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
