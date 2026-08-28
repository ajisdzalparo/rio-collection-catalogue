import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { userKeys } from '../keys';
import type { User } from '../types/user.types';
import type { CreateUserSchema } from '../schemas/schema';
import { toast } from 'sonner';

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateUserSchema) => {
      const response = await apiClient.post<User>('/users', payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create user');
    }
  });
}
