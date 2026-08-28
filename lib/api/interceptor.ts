import { apiClient } from '@/lib/api/client';
import { getToken } from '@/lib/auth/token';
import { useAuthStore } from '@/lib/auth/auth-store';

export function setupApiInterceptor() {
  apiClient.interceptors.request.use((config) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        useAuthStore.getState().logout();
      }
      return Promise.reject(error);
    }
  );
}
setupApiInterceptor();
