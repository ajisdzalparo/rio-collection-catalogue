'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: user, isLoading, error } = useQuery<UserSession | null>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const { data } = await axios.get('/api/v1/auth/me');
        if (data.code === 200 && data.data) {
          return data.data;
        }
        return null;
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password?: string }) => {
      const { data } = await axios.post('/api/v1/auth/login', credentials);
      if (data.code !== 200 || !data.data) {
        throw new Error(data.message || 'Login gagal');
      }
      return data.data as UserSession;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data);
      router.push('/dashboard');
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await axios.post('/api/v1/auth/logout');
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      router.push('/login');
    }
  });

  return {
    user: user || null,
    isAuthenticated: !!user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending
  };
}
