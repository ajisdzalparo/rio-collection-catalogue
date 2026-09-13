'use client';

import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

interface ResetUserPasswordInput {
  id: string;
  newPassword: string;
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: async ({ id, newPassword }: ResetUserPasswordInput) => {
      const { data } = await axios.patch(`/api/v1/users/${id}/password`, { newPassword });
      return data as { code: number; status: string; message: string };
    }
  });
}
