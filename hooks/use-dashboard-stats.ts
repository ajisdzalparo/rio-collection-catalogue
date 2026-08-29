'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  totalRevenue: number;
  outOfStockProducts: number;
  monthlyGrowth: number;
}

export interface DateFilterParams {
  startDate?: string;
  endDate?: string;
}

async function fetchStats(params?: DateFilterParams): Promise<DashboardStats> {
  const { data } = await axios.get('/api/v1/dashboard/stats', { params });
  if (data.code !== 200 || !data.data) {
    throw new Error(data.message || 'Invalid stats data received');
  }
  return data.data;
}

export function useDashboardStats(params?: DateFilterParams) {
  return useQuery<DashboardStats, Error>({
    queryKey: ['dashboard', 'stats', params?.startDate, params?.endDate],
    queryFn: () => fetchStats(params)
  });
}
