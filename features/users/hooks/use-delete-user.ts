'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteUser } from '../api/delete-user';
import { userKeys } from '../keys';
import { toast } from 'sonner';

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete user');
    }
  });
}
