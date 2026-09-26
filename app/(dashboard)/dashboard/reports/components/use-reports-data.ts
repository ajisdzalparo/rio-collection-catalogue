'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useOrders } from '@/hooks/use-orders';
import type {
  ChartInsights,
  DailyChartPoint,
  PresetRangeType,
  ReportGrowth,
  ReportMetrics,
  ReportStatus,
  TopSellingProduct
} from './types';

export const formatDateToInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  return new Date(year, month - 1, day).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

interface ReportsApiData {
  currentMetrics: ReportMetrics;
  growth: ReportGrowth;
  topProducts: TopSellingProduct[];
  chartDataPoints: DailyChartPoint[];
  chartInsights: ChartInsights;
  availableProducts: string[];
  hasPreviousPeriod: boolean;
}

const EMPTY_METRICS: ReportMetrics = {
  grossSales: 0,
  customerDiscount: 0,
  revenue: 0,
  totalHpp: 0,
  netProfit: 0,
  cashReward: 0,
  shirtRewardCost: 0,
  profitAfterReferral: 0,
  profitMargin: 0,
  totalQty: 0
};

export function useReportsData() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    return formatDateToInput(date);
  });
  const [endDate, setEndDate] = useState(() => formatDateToInput(new Date()));
  const [presetRange, setPresetRange] = useState<PresetRangeType>('30D');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<ReportStatus[]>([]);
  const statuses = useMemo(
    () => (selectedStatuses.length ? selectedStatuses : ['PAID', 'FULFILLED']),
    [selectedStatuses]
  );

  const reportQuery = useQuery<ReportsApiData, Error>({
    queryKey: [
      'reports',
      'sales',
      startDate,
      endDate,
      selectedProducts.join(','),
      statuses.join(',')
    ],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/reports/sales', {
        params: {
          startDate,
          endDate,
          product: selectedProducts.length ? selectedProducts.join(',') : undefined,
          status: statuses.join(',')
        }
      });
      if (data.code !== 200 || !data.data) {
        throw new Error(data.message || 'Gagal memuat laporan.');
      }
      return data.data as ReportsApiData;
    },
    placeholderData: (previousData) => previousData
  });

  const exportOrdersQuery = useOrders({
    status: statuses,
    product: selectedProducts.length ? selectedProducts : undefined,
    startDate,
    endDate
  });

  const applyPreset = useCallback((preset: PresetRangeType) => {
    const now = new Date();
    if (preset === '7D' || preset === '30D') {
      const start = new Date(now);
      start.setDate(now.getDate() - (preset === '7D' ? 6 : 29));
      setStartDate(formatDateToInput(start));
      setEndDate(formatDateToInput(now));
    } else if (preset === 'THIS_MONTH') {
      setStartDate(formatDateToInput(new Date(now.getFullYear(), now.getMonth(), 1)));
      setEndDate(formatDateToInput(now));
    } else if (preset === 'LAST_MONTH') {
      setStartDate(formatDateToInput(new Date(now.getFullYear(), now.getMonth() - 1, 1)));
      setEndDate(formatDateToInput(new Date(now.getFullYear(), now.getMonth(), 0)));
    } else if (preset === 'ALL') {
      setStartDate('2000-01-01');
      setEndDate(formatDateToInput(now));
    }
  }, []);

  const data = reportQuery.data;
  return {
    orders: exportOrdersQuery.data,
    isLoading: reportQuery.isLoading || exportOrdersQuery.isLoading,
    error: reportQuery.error || exportOrdersQuery.error,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    presetRange,
    setPresetRange,
    selectedProducts,
    setSelectedProducts,
    selectedStatuses,
    setSelectedStatuses,
    applyPreset,
    availableProducts: data?.availableProducts ?? [],
    currentOrders: exportOrdersQuery.data,
    currentMetrics: data?.currentMetrics ?? EMPTY_METRICS,
    growth: data?.growth ?? { revenue: 0, profit: 0, qty: 0 },
    topProducts: data?.topProducts ?? [],
    chartDataPoints: data?.chartDataPoints ?? [],
    chartInsights: data?.chartInsights ?? {
      peakRevenue: 0,
      peakLabel: '-',
      avgDaily: 0,
      daysWithSales: 0,
      totalPoints: 0
    },
    hasPreviousPeriod: data?.hasPreviousPeriod ?? false
  };
}
