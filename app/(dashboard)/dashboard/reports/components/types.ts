export interface ReportMetrics {
  revenue: number;
  totalHpp: number;
  netProfit: number;
  profitMargin: number;
  totalQty: number;
}

export interface ReportGrowth {
  revenue: number;
  profit: number;
  qty: number;
}

export interface TopSellingProduct {
  name: string;
  totalQty: number;
  revenue: number;
  profit: number;
}

export interface DailyChartPoint {
  label: string;
  revenue: number;
  profit: number;
  prevRevenue: number;
}

export interface ChartInsights {
  peakRevenue: number;
  peakLabel: string;
  avgDaily: number;
  daysWithSales: number;
  totalPoints: number;
}

export type PresetRangeType = '7D' | '30D' | 'THIS_MONTH' | 'LAST_MONTH' | 'ALL' | 'CUSTOM';

export type ReportStatus = 'PAID' | 'FULFILLED';
