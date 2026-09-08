'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ArchiveCollection } from '@/types/catalogue.types';

export type ArchiveInput = Pick<ArchiveCollection, 'name' | 'slug' | 'description' | 'imageUrl' | 'journalId'>;

async function archiveRequest(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Gagal memproses arsip');
  return result;
}

export function useArchives() {
  const client = useQueryClient();
  const query = useQuery<ArchiveCollection[]>({
    queryKey: ['archives'], queryFn: async () => (await archiveRequest('/api/v1/archives')).data
  });
  const save = useMutation({
    mutationFn: ({ id, data }: { id?: string; data: ArchiveInput }) => archiveRequest(
      id ? `/api/v1/archives/${id}` : '/api/v1/archives',
      { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
    ),
    onSuccess: () => client.invalidateQueries({ queryKey: ['archives'] })
  });
  const remove = useMutation({
    mutationFn: (id: string) => archiveRequest(`/api/v1/archives/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['archives'] })
  });
  return { ...query, save, remove };
}
