'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export interface StoreBankItem {
  id: string;
  bankName: string;
  accountNumber: string;
  accountOwner: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export function useStoreBanksQuery(activeOnly = false) {
  return useQuery({
    queryKey: ['store-banks', activeOnly],
    queryFn: async () => {
      const { data } = await axios.get(
        `/api/v1/store-banks${activeOnly ? '?activeOnly=true' : ''}`
      );
      if (data.code === 200 && data.data) {
        return data.data as StoreBankItem[];
      }
      return Array.isArray(data) ? data : [];
    },
    placeholderData: (previousData) => previousData
  });
}

export function useStoreBankMutations() {
  const queryClient = useQueryClient();

  const addStoreBankMutation = useMutation({
    mutationFn: async (payload: {
      bankName: string;
      accountNumber: string;
      accountOwner: string;
      isActive?: boolean;
      sortOrder?: number;
    }) => {
      const { data } = await axios.post('/api/v1/store-banks', payload);
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['store-banks'] })
  });

  const updateStoreBankMutation = useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      bankName?: string;
      accountNumber?: string;
      accountOwner?: string;
      isActive?: boolean;
      sortOrder?: number;
    }) => {
      const { data } = await axios.put(`/api/v1/store-banks/${id}`, payload);
      return data.data;
    },
    onMutate: async ({ id, ...payload }) => {
      await queryClient.cancelQueries({ queryKey: ['store-banks'] });
      const previousStoreBanks = queryClient.getQueryData<StoreBankItem[]>(['store-banks', false]);

      queryClient.setQueryData<StoreBankItem[]>(['store-banks', false], (old) => {
        if (!Array.isArray(old)) return [];
        return old.map((item) => (item.id === id ? { ...item, ...payload } : item));
      });

      return { previousStoreBanks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousStoreBanks) {
        queryClient.setQueryData(['store-banks', false], context.previousStoreBanks);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['store-banks'] })
  });

  const deleteStoreBankMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/v1/store-banks/${id}`);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['store-banks'] })
  });

  const reorderStoreBanksMutation = useMutation({
    mutationFn: async (items: Array<{ id: string; sortOrder: number }>) => {
      const { data } = await axios.patch('/api/v1/store-banks', { items });
      return data;
    },
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: ['store-banks'] });
      const previousStoreBanks = queryClient.getQueryData<StoreBankItem[]>(['store-banks', false]);

      queryClient.setQueryData<StoreBankItem[]>(['store-banks', false], (old) => {
        if (!Array.isArray(old)) return [];
        const orderMap = new Map(items.map((it) => [it.id, it.sortOrder]));
        return [...old]
          .map((item) => ({
            ...item,
            sortOrder: orderMap.get(item.id) ?? item.sortOrder
          }))
          .sort((a, b) => a.sortOrder - b.sortOrder);
      });

      return { previousStoreBanks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousStoreBanks) {
        queryClient.setQueryData(['store-banks', false], context.previousStoreBanks);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['store-banks'] })
  });

  return {
    addStoreBank: addStoreBankMutation.mutateAsync,
    updateStoreBank: updateStoreBankMutation.mutateAsync,
    deleteStoreBank: deleteStoreBankMutation.mutateAsync,
    reorderStoreBanks: reorderStoreBanksMutation.mutateAsync,
    isAdding: addStoreBankMutation.isPending,
    isUpdating: updateStoreBankMutation.isPending,
    isDeleting: deleteStoreBankMutation.isPending,
    isReordering: reorderStoreBanksMutation.isPending
  };
}
