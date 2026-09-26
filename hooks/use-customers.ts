'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { Order } from './use-orders';

export interface CustomerSummary {
  id: string;
  whatsapp: string;
  fullName: string;
  latestAddress: string;
  addresses: string[];
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  orders: Order[];
}

export interface CustomersMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface UseCustomersParams {
  search?: string;
  types?: string[];
  page?: number;
  pageSize?: number;
}

export function useCustomers(params: UseCustomersParams = {}) {
  return useQuery<{ customers: CustomerSummary[]; meta: CustomersMeta }, Error>({
    queryKey: ['customers', params],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/customers', {
        params: {
          search: params.search || undefined,
          type: params.types?.length ? params.types.join(',') : undefined,
          page: params.page || 1,
          pageSize: params.pageSize || 10
        }
      });
      if (data.code !== 200 || !Array.isArray(data.data)) {
        throw new Error(data.message || 'Gagal memuat pelanggan.');
      }
      return { customers: data.data, meta: data.meta };
    },
    placeholderData: (previousData) => previousData
  });
}

export function useCustomer(customerId: string) {
  return useQuery<CustomerSummary, Error>({
    queryKey: ['customers', 'detail', customerId],
    enabled: Boolean(customerId),
    queryFn: async () => {
      const { data } = await axios.get(`/api/v1/customers/${encodeURIComponent(customerId)}`);
      if (data.code !== 200 || !data.data) {
        throw new Error(data.message || 'Pelanggan tidak ditemukan.');
      }
      return data.data as CustomerSummary;
    }
  });
}
