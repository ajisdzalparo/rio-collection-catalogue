'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { updateUser } from '../api/update-user';
import { userKeys } from '../keys';
import { toast } from 'sonner';
import type { UserFormValues } from '../schemas/schema';

import type { User } from '../types/user.types';

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<UserFormValues> }) =>
      updateUser(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: userKeys.all });
      const previousUsers = queryClient.getQueryData<User[]>(userKeys.lists());

      queryClient.setQueryData<User[]>(userKeys.lists(), (old) => {
        if (!old) return [];
        return old.map((u) => (u.id === id ? { ...u, ...payload } : u));
      });

      return { previousUsers };
    },
    onSuccess: () => {
      toast.success('Pengguna berhasil diperbarui');
    },
    onError: (error: unknown, _variables, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(userKeys.lists(), context.previousUsers);
      }
      const apiMessage = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      const message = apiMessage || (error instanceof Error ? error.message : undefined);

      toast.error(message || 'Gagal memperbarui pengguna. Mengembalikan status semula.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    }
  });
}
