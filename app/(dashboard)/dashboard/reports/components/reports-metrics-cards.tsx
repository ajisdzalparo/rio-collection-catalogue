import { TrendingUp, Coins, Receipt, Percent, Tag, HandCoins, ShoppingBag } from 'lucide-react';
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
    <div className="space-y-3">
      {/* Top 4 Primary Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 w-full min-w-0">
        {/* Penjualan Bersih (Net Revenue) */}
        <div className="bg-card border border-border/60 rounded-xl p-4.5 space-y-1.5 shadow-2xs min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Penjualan Bersih (Net)
            </span>
            <Receipt className="h-4 w-4" />
          </div>
          <h3 className="text-xl font-extrabold text-foreground tabular-nums">
            {formatIDR(currentMetrics.revenue)}
          </h3>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{currentMetrics.totalQty} unit produk terjual</span>
            {hasPreviousPeriod && (
              <span
                className={`font-bold ${growth.revenue >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
              >
                {growth.revenue >= 0 ? '+' : ''}
                {growth.revenue.toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {/* Total HPP Modal */}
        <div className="bg-card border border-border/60 rounded-xl p-4.5 space-y-1.5 shadow-2xs min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Total HPP (Modal)
            </span>
            <Coins className="h-4 w-4" />
          </div>
          <h3 className="text-xl font-extrabold text-foreground tabular-nums">
            {formatIDR(currentMetrics.totalHpp)}
          </h3>
          <p className="text-[11px] text-muted-foreground">Total modal produksi fisik.</p>
        </div>

        {/* Laba Bersih Toko (Net Profit Setelah Komisi) */}
        <div className="bg-card border border-border/60 rounded-xl p-4.5 space-y-1.5 shadow-2xs min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Laba Bersih Akhir
            </span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <h3 className="text-xl font-extrabold tabular-nums">
            {formatIDR(currentMetrics.profitAfterReferral)}
          </h3>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Laba kotor: {formatIDR(currentMetrics.netProfit)}</span>
            {hasPreviousPeriod && (
              <span
                className={`font-bold ${growth.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
              >
                {growth.profit >= 0 ? '+' : ''}
                {growth.profit.toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {/* Profit Margin */}
        <div className="bg-card border border-border/60 rounded-xl p-4.5 space-y-1.5 shadow-2xs min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Profit Margin
            </span>
            <Percent className="h-4 w-4" />
          </div>
          <h3 className="text-xl font-extrabold text-foreground tabular-nums">
            {currentMetrics.profitMargin.toFixed(1)}%
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Rasio efisiensi laba atas omzet bersih.
          </p>
        </div>
      </div>

      {/* Secondary Referral & Discount Balance Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-border/60 bg-muted/10 p-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border/60 text-muted-foreground">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">
              Penjualan Kotor (Gross)
            </p>
            <p className="text-xs font-bold text-foreground">
              {formatIDR(currentMetrics.grossSales)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border/60 text-muted-foreground">
            <Tag className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">
              Diskon Customer (Referral)
            </p>
            <p className="text-xs font-bold">-{formatIDR(currentMetrics.customerDiscount)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border/60 text-muted-foreground">
            <HandCoins className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">
              Komisi Partner Referral
            </p>
            <p className="text-xs font-bold">{formatIDR(currentMetrics.cashReward)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
