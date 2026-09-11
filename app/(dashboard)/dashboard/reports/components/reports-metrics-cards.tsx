import React from 'react';
import { TrendingUp, Coins, Receipt, Percent } from 'lucide-react';
import { formatIDR } from '@/lib/utils';
import type { ReportMetrics, ReportGrowth } from './types';

interface ReportsMetricsCardsProps {
  currentMetrics: ReportMetrics;
  growth: ReportGrowth;
  hasPreviousPeriod: boolean;
}

export function ReportsMetricsCards({
  currentMetrics,
  growth,
  hasPreviousPeriod
}: ReportsMetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Revenue */}
      <div className="bg-card border border-border/40 rounded-xl p-5 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Revenue
          </span>
          <Receipt className="h-4 w-4 text-blue-500" />
        </div>
        <h3 className="text-xl font-black text-foreground tabular-nums">
          {formatIDR(currentMetrics.revenue)}
        </h3>
        {hasPreviousPeriod && (
          <p
            className={`text-[10px] font-bold ${growth.revenue >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
          >
            {growth.revenue >= 0 ? '+' : ''}
            {growth.revenue.toFixed(1)}% vs periode lalu
          </p>
        )}
      </div>

      {/* Total HPP */}
      <div className="bg-card border border-border/40 rounded-xl p-5 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Total HPP
          </span>
          <Coins className="h-4 w-4 text-amber-500" />
        </div>
        <h3 className="text-xl font-black text-foreground tabular-nums">
          {formatIDR(currentMetrics.totalHpp)}
        </h3>
        <p className="text-[10px] text-muted-foreground">Akumulasi modal produksi.</p>
      </div>

      {/* Laba Kotor */}
      <div className="bg-card border border-border/40 rounded-xl p-5 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Laba Kotor
          </span>
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        </div>
        <h3 className="text-xl font-black text-foreground tabular-nums">
          {formatIDR(currentMetrics.netProfit)}
        </h3>
        {hasPreviousPeriod && (
          <p
            className={`text-[10px] font-bold ${growth.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
          >
            {growth.profit >= 0 ? '+' : ''}
            {growth.profit.toFixed(1)}% vs periode lalu
          </p>
        )}
      </div>

      {/* Profit Margin */}
      <div className="bg-card border border-border/40 rounded-xl p-5 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Profit Margin
          </span>
          <Percent className="h-4 w-4 text-purple-500" />
        </div>
        <h3 className="text-xl font-black text-foreground tabular-nums">
          {currentMetrics.profitMargin.toFixed(1)}%
        </h3>
        <p className="text-[10px] text-muted-foreground">Rasio efisiensi margin.</p>
      </div>
    </div>
  );
}
