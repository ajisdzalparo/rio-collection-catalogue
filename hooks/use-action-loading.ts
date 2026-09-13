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
 * Registers Axios interceptors for requests that explicitly opt in to the blocking overlay.
 * Normal CMS mutations use their own button, dialog, or row-level pending state.
 */
export function setupAxiosLoadingInterceptors() {
  if (isAxiosIntercepted || typeof window === 'undefined') return;
  isAxiosIntercepted = true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRequest = (config: any) => {
    if (config.blockingLoadingOverlay === true) {
      config.__hasLoadingOverlay = true;
      useActionLoadingStore
        .getState()
        .startLoading(config.blockingLoadingMessage || 'Memproses perubahan...');
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
