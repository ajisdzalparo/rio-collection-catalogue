'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Product, ProductMutationInput } from '@/types/catalogue.types';
import { normalizeProductAvailability } from '@/lib/product-availability';
import axios from 'axios';

export interface UseProductsParams {
  search?: string;
  category?: string | string[];
  status?: string | string[];
  stockState?: string | string[];
  needsStock?: boolean;
  includeStats?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ProductsMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  stats?: {
    totalProducts: number;
    inStockCount: number;
    lowStockCount: number;
    soldOutCount: number;
  };
}

async function fetchProducts(
  params?: UseProductsParams
): Promise<{ products: Product[]; meta: ProductsMeta }> {
  const queryParams: Record<string, string> = {};
  if (params?.search) queryParams.search = params.search;
  if (params?.category) {
    queryParams.category = Array.isArray(params.category)
      ? params.category.join(',')
      : params.category;
  }
  if (params?.status) {
    queryParams.status = Array.isArray(params.status) ? params.status.join(',') : params.status;
  }
  if (params?.stockState) {
    queryParams.stockState = Array.isArray(params.stockState)
      ? params.stockState.join(',')
      : params.stockState;
  }
  if (params?.needsStock) queryParams.needsStock = 'true';
  if (params?.includeStats) queryParams.includeStats = 'true';
  if (params?.page) queryParams.page = String(params.page);
  if (params?.pageSize) queryParams.pageSize = String(params.pageSize);

  const { data } = await axios.get('/api/v1/products', { params: queryParams });
  let prods: Product[] = [];
  if (data.code === 200 && data.data) {
    prods = data.data;
  } else if (Array.isArray(data)) {
    prods = data;
  } else {
    throw new Error('Invalid products data received');
  }

  const products = prods.map(normalizeProductAvailability);
  const meta: ProductsMeta = data.meta ?? {
    page: 1,
    pageSize: products.length,
    total: products.length,
    totalPages: 1
  };

  return { products, meta };
}

export function useProducts(params?: UseProductsParams) {
  const queryClient = useQueryClient();

  const queryKey = [
    'products',
    params?.search || '',
    Array.isArray(params?.category) ? params.category.join(',') : params?.category || '',
    Array.isArray(params?.status) ? params.status.join(',') : params?.status || '',
    Array.isArray(params?.stockState) ? params.stockState.join(',') : params?.stockState || '',
    params?.needsStock || false,
    params?.includeStats || false,
    params?.page || 1,
    params?.pageSize || ''
  ];

  const query = useQuery<{ products: Product[]; meta: ProductsMeta }, Error>({
    queryKey,
    queryFn: () => fetchProducts(params),
    placeholderData: (previousData) => previousData
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
    data: query.data?.products ?? [],
    meta: query.data?.meta ?? { page: 1, pageSize: 10, total: 0, totalPages: 1 },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createProduct: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateProduct: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteProduct: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  };
}
