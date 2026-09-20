'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface QuoteItem {
  productId: string;
  quantity: number;
}

interface ReferralQuote {
  code: string;
  subtotal: number;
  discountAmount: number;
  netSubtotal: number;
}

export function useReferralQuote(code: string, items: QuoteItem[]) {
  const key = items.map((item) => `${item.productId}:${item.quantity}`).join('|');
  return useQuery<ReferralQuote, Error>({
    queryKey: ['referral-quote', code, key],
    enabled: Boolean(code && items.length),
    retry: false,
    queryFn: async () => {
      try {
        const response = await axios.post('/api/v1/referrals/quote', { code, items });
        return response.data.data as ReferralQuote;
      } catch (error) {
        if (axios.isAxiosError(error)) throw new Error(error.response?.data?.error || 'Kode tidak dapat divalidasi.');
        throw error;
      }
    }
  });
}
