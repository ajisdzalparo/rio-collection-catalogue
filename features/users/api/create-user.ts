import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { userKeys } from '../keys';
import type { User } from '../types/user.types';
import type { CreateUserSchema } from '../schemas/schema';
import { toast } from 'sonner';

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateUserSchema) => {
      const response = await axios.post<{ data: User }>('/api/v1/users', payload);
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('Pengguna berhasil ditambahkan.');
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menambahkan pengguna.');
    }
  });
}
