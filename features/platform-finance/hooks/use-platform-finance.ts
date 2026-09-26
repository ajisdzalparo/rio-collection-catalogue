'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios, { type AxiosRequestConfig } from 'axios';
import type {
  CommissionMode,
  PlatformFinanceData,
  PlatformFinanceSettings
} from '../types';

export interface PlatformFinanceSettingsPayload {
  commissionMode: CommissionMode;
  commissionValue: number;
}

export interface PlatformFinancePeriod {
  startDate: string;
  endDate: string;
}

export interface PlatformFinanceQuery extends PlatformFinancePeriod {
  search?: string;
  status?: string;
  page: number;
  pageSize: number;
}

export function usePlatformFinance(queryParams: PlatformFinanceQuery, enabled: boolean) {
  const queryClient = useQueryClient();
  const queryKey = ['platform-finance', queryParams];
  const query = useQuery<PlatformFinanceData, Error>({
    queryKey,
    enabled,
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: queryParams.startDate,
        endDate: queryParams.endDate,
        page: String(queryParams.page),
        pageSize: String(queryParams.pageSize)
      });
      if (queryParams.search) params.set('search', queryParams.search);
      if (queryParams.status && queryParams.status !== 'ALL') {
        params.set('status', queryParams.status);
      }
      const response = await axios.get(`/api/v1/platform-finance?${params.toString()}`);
      if (response.data.code !== 200 || !response.data.data) {
        throw new Error(response.data.message || 'Gagal memuat finance platform.');
      }
      return response.data.data as PlatformFinanceData;
    },
    placeholderData: (previousData) => previousData
  });

  const updateSettings = useMutation<PlatformFinanceSettings, Error, PlatformFinanceSettingsPayload>({
    mutationKey: ['platform-finance-settings', 'skip-overlay'],
    mutationFn: async (payload) => {
      const config: AxiosRequestConfig & { skipLoadingOverlay: boolean } = {
        skipLoadingOverlay: true
      };
      const response = await axios.patch('/api/v1/platform-finance', payload, config);
      if (response.data.code !== 200 || !response.data.data) {
        throw new Error(response.data.message || 'Gagal menyimpan pengaturan finance.');
      }
      return response.data.data as PlatformFinanceSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-finance'] });
    }
  });

  return {
    ...query,
    updateSettings: updateSettings.mutateAsync,
    isUpdatingSettings: updateSettings.isPending
  };
}
