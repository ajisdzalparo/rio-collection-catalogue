'use client';

import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

interface PasswordResetRequestResult {
  message: string;
  isDevMode?: boolean;
}

interface PasswordResetConfirmPayload {
  email: string;
  otpCode: string;
  newPassword: string;
}

export function usePasswordReset() {
  const requestMutation = useMutation({
    mutationFn: async (email: string): Promise<PasswordResetRequestResult> => {
      const { data } = await axios.post('/api/v1/auth/password-reset/request', { email });
      return {
        message: data.message || data.data?.message || 'Kode OTP telah dikirim.',
        isDevMode: data.data?.isDevMode
      };
    }
  });

  const confirmMutation = useMutation({
    mutationFn: async (payload: PasswordResetConfirmPayload): Promise<string> => {
      const { data } = await axios.post('/api/v1/auth/password-reset/confirm', payload);
      return data.message || 'Kata sandi berhasil diatur ulang.';
    }
  });

  return {
    requestReset: requestMutation.mutateAsync,
    confirmReset: confirmMutation.mutateAsync,
    isRequesting: requestMutation.isPending,
    isConfirming: confirmMutation.isPending
  };
}
