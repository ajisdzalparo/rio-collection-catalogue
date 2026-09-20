'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import type { RolePermissions } from '@/features/users/types/roles.types';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  permissions: RolePermissions;
}

let legacyRbacCleared = false;

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (legacyRbacCleared) return;
    try { window.localStorage.removeItem('rio-rbac-store'); } catch { /* Storage may be unavailable. */ }
    legacyRbacCleared = true;
  }, []);

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
    staleTime: 0,
    refetchInterval: (query) => query.state.data ? 10_000 : false,
    refetchOnWindowFocus: 'always'
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password?: string }) => {
      const { data } = await axios.post('/api/v1/auth/login', credentials);
      if (data.code !== 200 || !data.data) {
        throw new Error(data.message || 'Login gagal');
      }
      return data.data as Omit<UserSession, 'permissions'>;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      router.push('/dashboard');
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await axios.post('/api/v1/auth/logout');
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.removeQueries({ queryKey: ['roles'] });
      queryClient.removeQueries({ queryKey: ['referrals'] });
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
