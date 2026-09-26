'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Testimony } from '@/types/catalogue.types';
import axios from 'axios';

export interface UseTestimoniesParams {
  search?: string;
  status?: string[];
  page?: number;
  pageSize?: number;
}

export interface TestimoniesMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  stats?: { total: number; active: number; hidden: number };
}

async function fetchTestimonies(
  params?: UseTestimoniesParams
): Promise<{ testimonies: Testimony[]; meta: TestimoniesMeta }> {
  const queryParams: Record<string, string> = {};
  if (params?.search) queryParams.search = params.search;
  if (params?.status?.length) queryParams.status = params.status.join(',');
  if (params?.page) queryParams.page = String(params.page);
  if (params?.pageSize) queryParams.pageSize = String(params.pageSize);

  const { data } = await axios.get('/api/v1/testimonies', { params: queryParams });
  let list: Testimony[] = [];
  if (data.code === 200 && data.data) {
    list = data.data.map((item: Testimony & { clientName?: string }, index: number) => ({
      ...item,
      clientName: item.clientName || item.alt || `Pelanggan Testimoni ${index + 1}`,
      status: item.status || 'ACTIVE',
      createdAt: item.createdAt || '2026-08-01'
    }));
  }

  const meta: TestimoniesMeta = data.meta ?? {
    page: 1,
    pageSize: list.length,
    total: list.length,
    totalPages: 1
  };

  return { testimonies: list, meta };
}

export function useTestimonies(params?: UseTestimoniesParams) {
  const queryClient = useQueryClient();

  const queryKey = [
    'testimonies',
    params?.search || '',
    params?.status?.join(',') || '',
    params?.page || 1,
    params?.pageSize || ''
  ];

  const query = useQuery<{ testimonies: Testimony[]; meta: TestimoniesMeta }, Error>({
    queryKey,
    queryFn: () => fetchTestimonies(params),
    placeholderData: (previousData) => previousData
  });

  const createMutation = useMutation({
    mutationFn: async (newItem: Omit<Testimony, 'id' | 'createdAt'>) => {
      const { data } = await axios.post('/api/v1/testimonies', {
        alt: newItem.clientName || newItem.alt,
        imageUrl: newItem.imageUrl
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonies'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Testimony> }) => {
      const { data } = await axios.patch(`/api/v1/testimonies/${id}`, updates);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonies'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/v1/testimonies/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonies'] });
    }
  });

  return {
    data: query.data?.testimonies ?? [],
    meta: query.data?.meta ?? { page: 1, pageSize: 10, total: 0, totalPages: 1 },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    addTestimony: createMutation.mutateAsync,
    isAdding: createMutation.isPending,
    updateTestimony: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteTestimony: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  };
}
