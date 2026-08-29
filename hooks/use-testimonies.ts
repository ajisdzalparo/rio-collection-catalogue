'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Testimony } from '@/types/catalogue.types';
import axios from 'axios';

async function fetchTestimonies(): Promise<Testimony[]> {
  const { data } = await axios.get('/api/v1/testimonies');
  if (data.code === 200 && data.data) {
    return data.data.map((item: Testimony & { clientName?: string }, index: number) => ({
      ...item,
      clientName: item.clientName || item.alt || `Pelanggan Testimoni ${index + 1}`,
      status: item.status || 'ACTIVE',
      createdAt: item.createdAt || '2026-08-01'
    }));
  }
  return [];
}

export function useTestimonies() {
  const queryClient = useQueryClient();

  const query = useQuery<Testimony[], Error>({
    queryKey: ['testimonies'],
    queryFn: fetchTestimonies
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
    data: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    addTestimony: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateTestimony: (id: string, updates: Partial<Testimony>) => updateMutation.mutateAsync({ id, updates }),
    isUpdating: updateMutation.isPending,
    toggleTestimonyStatus: async (id: string) => {
      const item = (query.data || []).find((t) => t.id === id);
      const newStatus = item?.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE';
      return updateMutation.mutateAsync({ id, updates: { status: newStatus } });
    },
    deleteTestimony: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  };
}
