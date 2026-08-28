'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUser } from '../api/update-user';
import { userKeys } from '../keys';
import { toast } from 'sonner';
import type { UserFormValues } from '../schemas/schema';

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<UserFormValues> }) =>
      updateUser(id, payload),
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user');
    }
  });
}
