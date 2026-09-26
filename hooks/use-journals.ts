'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { JournalArticle } from '@/types/catalogue.types';
import axios from 'axios';

export interface UseJournalsParams {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

export interface JournalsMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

async function fetchJournals(
  params?: UseJournalsParams
): Promise<{ articles: JournalArticle[]; meta: JournalsMeta }> {
  const queryParams: Record<string, string> = {};
  if (params?.search) queryParams.search = params.search;
  if (params?.category) queryParams.category = params.category;
  if (params?.page) queryParams.page = String(params.page);
  if (params?.pageSize) queryParams.pageSize = String(params.pageSize);

  const { data } = await axios.get('/api/v1/journals', { params: queryParams });
  let articles: JournalArticle[] = [];
  if (data.code === 200 && data.data) {
    articles = data.data;
  } else if (Array.isArray(data)) {
    articles = data;
  } else {
    throw new Error('Invalid journals data received');
  }

  const meta: JournalsMeta = data.meta ?? {
    page: 1,
    pageSize: articles.length,
    total: articles.length,
    totalPages: 1
  };

  return { articles, meta };
}

export function useJournals(params?: UseJournalsParams) {
  const queryClient = useQueryClient();

  const queryKey = [
    'journals',
    params?.search || '',
    params?.category || '',
    params?.page || 1,
    params?.pageSize || ''
  ];

  const query = useQuery<{ articles: JournalArticle[]; meta: JournalsMeta }, Error>({
    queryKey,
    queryFn: () => fetchJournals(params),
    placeholderData: (previousData) => previousData
  });

  const createMutation = useMutation({
    mutationFn: async (newArticle: JournalArticle) => {
      const { data } = await axios.post('/api/v1/journals', newArticle);
      return data.data || newArticle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedArticle: JournalArticle) => {
      const { data } = await axios.put(`/api/v1/journals/${updatedArticle.id}`, updatedArticle);
      return data.data || updatedArticle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/v1/journals/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
    }
  });

  return {
    data: query.data?.articles ?? [],
    meta: query.data?.meta ?? { page: 1, pageSize: 10, total: 0, totalPages: 1 },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createJournal: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateJournal: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteJournal: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  };
}
