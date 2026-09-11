'use client';

import { create } from 'zustand';
import axios from 'axios';
import { apiClient } from '@/lib/api/client';

interface ActionLoadingState {
  activeCount: number;
  message: string;
  startLoading: (customMessage?: string) => void;
  stopLoading: () => void;
  setMessage: (msg: string) => void;
}

export const useActionLoadingStore = create<ActionLoadingState>((set) => ({
  activeCount: 0,
  message: 'Memproses...',
  startLoading: (customMessage) =>
    set((state) => ({
      activeCount: state.activeCount + 1,
      message: customMessage || (state.activeCount === 0 ? 'Memproses...' : state.message)
    })),
  stopLoading: () =>
    set((state) => {
      const nextCount = Math.max(0, state.activeCount - 1);
      return {
        activeCount: nextCount,
        message: nextCount === 0 ? 'Memproses...' : state.message
      };
    }),
  setMessage: (msg) => set({ message: msg })
}));

/**
 * Executes an async function with the blocking action loading overlay active.
 */
export async function withActionLoading<T>(
  promiseOrFn: Promise<T> | (() => Promise<T>),
  customMessage?: string
): Promise<T> {
  const { startLoading, stopLoading } = useActionLoadingStore.getState();
  startLoading(customMessage);
  try {
    const fn = typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;
    return await fn;
  } finally {
    stopLoading();
  }
}

let isAxiosIntercepted = false;

/**
 * Registers global Axios interceptors for mutating HTTP requests (POST, PUT, PATCH, DELETE).
 * Initial GET requests and rate calculations are explicitly ignored.
 */
export function setupAxiosLoadingInterceptors() {
  if (isAxiosIntercepted || typeof window === 'undefined') return;
  isAxiosIntercepted = true;

  const mutatingMethods = new Set(['post', 'put', 'patch', 'delete']);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRequest = (config: any) => {
    const method = (config.method || 'get').toLowerCase();

    // Only intercept mutating actions (POST, PUT, PATCH, DELETE)
    if (mutatingMethods.has(method) && !config.skipLoadingOverlay) {
      const url = String(config.url || '');

      // Exclude rate check or background cron jobs
      const isReadOnlyOrCron =
        url.includes('/shipping/cost') ||
        url.includes('/api/cron/') ||
        url.includes('/cron');

      if (!isReadOnlyOrCron) {
        config.__hasLoadingOverlay = true;

        let actionMsg = 'Menyimpan perubahan...';
        if (method === 'delete') actionMsg = 'Menghapus data...';
        else if (method === 'post') actionMsg = 'Menambahkan data...';
        else if (method === 'put' || method === 'patch') actionMsg = 'Memperbarui data...';

        useActionLoadingStore.getState().startLoading(actionMsg);
      }
    }
    return config;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleResponse = (response: any) => {
    if (response?.config?.__hasLoadingOverlay) {
      useActionLoadingStore.getState().stopLoading();
    }
    return response;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleError = (error: any) => {
    if (error?.config?.__hasLoadingOverlay) {
      useActionLoadingStore.getState().stopLoading();
    }
    return Promise.reject(error);
  };

  axios.interceptors.request.use(handleRequest, (err) => Promise.reject(err));
  axios.interceptors.response.use(handleResponse, handleError);

  if (apiClient) {
    apiClient.interceptors.request.use(handleRequest, (err) => Promise.reject(err));
    apiClient.interceptors.response.use(handleResponse, handleError);
  }
}
