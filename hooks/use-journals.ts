'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { JournalArticle } from '@/types/catalogue.types';
import axios from 'axios';

async function fetchJournals(): Promise<JournalArticle[]> {
  const { data } = await axios.get('/api/v1/journals');
  if (data.code === 200 && data.data) {
    return data.data;
  }
  if (Array.isArray(data)) {
    return data;
  }
  throw new Error('Invalid journals data received');
}

export function useJournals() {
  const queryClient = useQueryClient();

  const query = useQuery<JournalArticle[], Error>({
    queryKey: ['journals'],
    queryFn: fetchJournals
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
    ...query,
    createJournal: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateJournal: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteJournal: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  };
}
