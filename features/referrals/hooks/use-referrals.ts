'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { ReferralPartnerView } from '../types';

function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) return error.response?.data?.error || error.message;
  return error instanceof Error ? error.message : 'Permintaan gagal.';
}

export function useReferralDashboard() {
  return useQuery<ReferralPartnerView[], Error>({
    queryKey: ['referrals', 'dashboard'],
    queryFn: async () => {
      const response = await axios.get('/api/v1/referrals/dashboard');
      return response.data.data as ReferralPartnerView[];
    }
  });
}

export function useReferralPartner(partnerId: string) {
  const query = useReferralDashboard();
  const partner = query.data?.find((p) => p.id === partnerId) ?? null;
  return {
    ...query,
    partner
  };
}

export function useReferralActions() {
  const queryClient = useQueryClient();
  return {
    async post(path: string, payload: object) {
      try {
        await axios.post(`/api/v1/referrals/${path}`, payload);
        await queryClient.invalidateQueries({ queryKey: ['referrals', 'dashboard'] });
        await queryClient.invalidateQueries({ queryKey: ['products'] });
      } catch (error) {
        throw new Error(getApiError(error));
      }
    },
    async toggleCode(id: string, isActive: boolean) {
      try {
        await axios.patch(`/api/v1/referrals/codes/${id}`, { isActive });
        await queryClient.invalidateQueries({ queryKey: ['referrals', 'dashboard'] });
      } catch (error) {
        throw new Error(getApiError(error));
      }
    },
    async deleteCode(id: string) {
      try {
        await axios.delete(`/api/v1/referrals/codes/${id}`);
        await queryClient.invalidateQueries({ queryKey: ['referrals', 'dashboard'] });
      } catch (error) {
        throw new Error(getApiError(error));
      }
    },
    async deletePartner(id: string) {
      try {
        await axios.delete(`/api/v1/referrals/partners/${id}`);
        await queryClient.invalidateQueries({ queryKey: ['referrals', 'dashboard'] });
      } catch (error) {
        throw new Error(getApiError(error));
      }
    }
  };
}
