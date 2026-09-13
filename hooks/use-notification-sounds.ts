'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type {
  NotificationSound,
  NotificationSoundLibrary
} from '@/lib/notification-sound-types';

const QUERY_KEY = ['notification-sounds'] as const;

async function fetchNotificationSounds(): Promise<NotificationSoundLibrary> {
  const { data } = await axios.get('/api/v1/notification-sounds');
  if (data.code !== 200 || !data.data) {
    throw new Error(data.message || 'Daftar suara notifikasi tidak valid');
  }
  return data.data as NotificationSoundLibrary;
}

export function useNotificationSounds() {
  const queryClient = useQueryClient();
  const query = useQuery<NotificationSoundLibrary, Error>({
    queryKey: QUERY_KEY,
    queryFn: fetchNotificationSounds,
    staleTime: 60_000
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      const { data } = await axios.post('/api/v1/notification-sounds', formData);
      return data.data as NotificationSound[];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })
  });

  const selectMutation = useMutation({
    mutationFn: async (selectedKey: string | null) => {
      await axios.patch('/api/v1/notification-sounds', { selectedKey });
      return selectedKey;
    },
    onSuccess: (selectedKey) => {
      queryClient.setQueryData<NotificationSoundLibrary>(QUERY_KEY, (library) =>
        library ? { ...library, selectedKey } : library
      );
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      await axios.delete('/api/v1/notification-sounds', { data: { key } });
      return key;
    },
    onSuccess: (key) => {
      queryClient.setQueryData<NotificationSoundLibrary>(QUERY_KEY, (library) =>
        library
          ? {
              sounds: library.sounds.filter((sound) => sound.key !== key),
              selectedKey: library.selectedKey === key ? null : library.selectedKey
            }
          : library
      );
    }
  });

  const selectedSound = query.data?.sounds.find(
    (sound) => sound.key === query.data?.selectedKey
  );

  return {
    ...query,
    sounds: query.data?.sounds ?? [],
    selectedKey: query.data?.selectedKey ?? null,
    selectedSound,
    uploadSounds: uploadMutation.mutateAsync,
    selectSound: selectMutation.mutateAsync,
    deleteSound: deleteMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    isSelecting: selectMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}
