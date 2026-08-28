'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { JournalArticle } from '@/types/catalogue.types';
import axios from 'axios';
import { env } from '@/config/env';

async function fetchJournals(): Promise<JournalArticle[]> {
  const { data } = await axios.get(`${env.velomockUrl}/api/v1/journals`);
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
      await new Promise((resolve) => setTimeout(resolve, 300));
      return newArticle;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<JournalArticle[]>(['journals'], (old) => {
        if (!old) return [data];
        return [data, ...old];
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedArticle: JournalArticle) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return updatedArticle;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<JournalArticle[]>(['journals'], (old) => {
        if (!old) return [];
        return old.map((a) => (a.id === data.id ? data : a));
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return id;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<JournalArticle[]>(['journals'], (old) => {
        if (!old) return [];
        return old.filter((a) => a.id !== data);
      });
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
