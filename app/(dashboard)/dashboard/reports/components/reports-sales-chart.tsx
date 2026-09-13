import React, { useState, useMemo } from 'react';
import { BarChart3, LineChart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatIDR, cn } from '@/lib/utils';
import { formatDisplayDate } from './use-reports-data';
import type { DailyChartPoint, ChartInsights, PresetRangeType } from './types';

// Chart.js imports and initialization
import {
  Chart as ChartJS,
  registerables,
  type ChartOptions,
  type ChartData
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(...registerables);

interface ReportsSalesChartProps {
  chartDataPoints: DailyChartPoint[];
  chartInsights: ChartInsights;
  hasPreviousPeriod: boolean;
  startDate: string;
  endDate: string;
  selectedProduct: string;
  presetRange: PresetRangeType;
}

export function ReportsSalesChart({
  chartDataPoints,
  chartInsights,
  hasPreviousPeriod,
  startDate,
  endDate,
  selectedProduct,
  presetRange
}: ReportsSalesChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [showRevenue, setShowRevenue] = useState(true);
  const [showProfit, setShowProfit] = useState(true);
  const [showComparison, setShowComparison] = useState(true);

  // Chart.js Datasets Configuration
  const mixedChartData: ChartData<'bar' | 'line'> = useMemo(() => {
    const datasets: ChartData<'bar' | 'line'>['datasets'] = [];

    // Dataset 1: Revenue (Omset)
    if (showRevenue) {
      if (chartType === 'bar') {
        datasets.push({
          type: 'bar',
          label: 'Omset Periode Ini',
          data: chartDataPoints.map((d) => d.revenue),
          backgroundColor: '#3b82f6',
          hoverBackgroundColor: '#2563eb',
          borderRadius: 3,
          borderSkipped: 'bottom',
          maxBarThickness: 26,
          order: 2
        });
      } else {
        datasets.push({
          type: 'line',
          label: 'Omset Periode Ini',
          data: chartDataPoints.map((d) => d.revenue),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          fill: true,
          tension: 0.2,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          order: 2
        });
      }
    }

    // Dataset 2: Gross Profit (Laba Kotor)
    if (showProfit) {
      if (chartType === 'bar') {
        datasets.push({
          type: 'bar',
          label: 'Laba Kotor',
          data: chartDataPoints.map((d) => d.profit),
          backgroundColor: '#10b981',
          hoverBackgroundColor: '#059669',
          borderRadius: 3,
          borderSkipped: 'bottom',
          maxBarThickness: 26,
          order: 3
        });
      } else {
        datasets.push({
          type: 'line',
          label: 'Laba Kotor',
          data: chartDataPoints.map((d) => d.profit),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.06)',
          fill: true,
          tension: 0.2,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          order: 3
        });
      }
    }

    // Dataset 3: Comparison Line (Periode Sebelumnya)
    if (showComparison && hasPreviousPeriod) {
      datasets.push({
        type: 'line',
        label: 'Periode Sebelumnya',
        data: chartDataPoints.map((d) => d.prevRevenue),
        borderColor: '#71717a',
        borderWidth: 1.5,
        borderDash: [4, 4],
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: '#71717a',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1,
        fill: false,
        tension: 0.15,
        order: 1
      });
    }

    return {
      labels: chartDataPoints.map((d) => d.label),
      datasets
    };
  }, [chartDataPoints, hasPreviousPeriod, chartType, showRevenue, showProfit, showComparison]);

  // Chart.js Options
  const chartOptions: ChartOptions<'bar' | 'line'> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: '#18181b',
          titleColor: '#fafafa',
          titleFont: {
            size: 11,
            weight: 'bold'
          },
          bodyColor: '#d4d4d8',
          bodyFont: {
            size: 11
          },
          borderColor: '#27272a',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 6,
          boxPadding: 4,
          usePointStyle: true,
          callbacks: {
            title: (items) => {
              if (!items.length) return '';
              return items[0].label;
            },
            label: (context) => {
              const label = context.dataset.label || '';
              const value = Number(context.parsed.y || 0);
              return ` ${label}: ${formatIDR(value)}`;
            },
            afterBody: (items) => {
              const revItem = items.find((i) => i.dataset.label?.includes('Omset'));
              const profitItem = items.find((i) => i.dataset.label?.includes('Laba Kotor'));
              if (revItem && profitItem) {
                const rev = Number(revItem.parsed.y || 0);
                const profit = Number(profitItem.parsed.y || 0);
                if (rev > 0) {
                  const margin = ((profit / rev) * 100).toFixed(1);
                  return [`Margin: ${margin}%`];
                }
              }
              return [];
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          border: {
            display: false
          },
          ticks: {
            font: {
              size: 11
            },
            color: '#a1a1aa'
          }
        },
        y: {
          beginAtZero: true,
          border: {
            display: false
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.08)'
          },
          ticks: {
            font: {
              size: 10
            },
            color: '#a1a1aa',
            callback: (val) => {
              const num = Number(val);
              if (num === 0) return 'Rp 0';
              if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1).replace('.0', '')} jt`;
              if (num >= 1000) return `Rp ${(num / 1000).toFixed(0)} rb`;
              return `Rp ${num}`;
            }
          }
        }
      }
    };
  }, []);

  return (
    <div className="bg-card border border-border/40 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-xs w-full min-w-0 max-w-full">
      {/* Header: Title and Type Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/15 pb-3 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Aktivitas & Tren Penjualan
            </h4>
            <Badge variant="secondary" className="text-[10px] py-0 px-2 font-mono font-medium">
              {formatDisplayDate(startDate)} - {formatDisplayDate(endDate)}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {selectedProduct === 'ALL'
              ? 'Performa harian omset dan estimasi laba kotor'
              : `Filter produk: ${selectedProduct}`}
          </p>
        </div>

        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/40 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer',
              chartType === 'bar'
                ? 'bg-card text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Batang</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('area')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer',
              chartType === 'area'
                ? 'bg-card text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <LineChart className="h-3.5 w-3.5" />
            <span>Area</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full min-w-0">
        <div className="bg-muted/15 border border-border/30 rounded-lg p-3 min-w-0">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Puncak Penjualan
          </span>
          <div className="text-xs font-bold text-foreground mt-1 truncate">
            {chartInsights.peakRevenue > 0 ? (
              <>
                <span>{formatIDR(chartInsights.peakRevenue)}</span>
                <span className="text-[11px] font-normal text-muted-foreground ml-1.5">
                  • {chartInsights.peakLabel}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground font-normal">Belum ada transaksi</span>
            )}
          </div>
        </div>

        <div className="bg-muted/15 border border-border/30 rounded-lg p-3 min-w-0">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Rata-rata / Hari
          </span>
          <div className="text-xs font-bold text-foreground mt-1 tabular-nums">
            {formatIDR(chartInsights.avgDaily)}
          </div>
        </div>

        <div className="bg-muted/15 border border-border/30 rounded-lg p-3 min-w-0">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Hari Transaksi Aktif
          </span>
          <div className="text-xs font-bold text-foreground mt-1 tabular-nums">
            {chartInsights.daysWithSales}{' '}
            <span className="text-[11px] font-normal text-muted-foreground">
              dari {chartInsights.totalPoints} hari
            </span>
          </div>
        </div>
      </div>

      {/* Minimal Clean Legend */}
      <div className="flex items-center justify-start sm:justify-end gap-3 flex-wrap pt-0.5 border-t border-border/10">
        <button
          type="button"
          onClick={() => setShowRevenue(!showRevenue)}
          className={cn(
            'flex items-center gap-1.5 py-1 px-2 rounded-md transition-colors cursor-pointer text-xs',
            showRevenue ? 'text-foreground font-medium' : 'text-muted-foreground/40 line-through'
          )}
        >
          <span
            className={cn(
              'size-2 rounded-full transition-opacity',
              showRevenue ? 'bg-blue-500' : 'bg-muted-foreground/30'
            )}
          />
          <span>Omset</span>
        </button>

        <button
          type="button"
          onClick={() => setShowProfit(!showProfit)}
          className={cn(
            'flex items-center gap-1.5 py-1 px-2 rounded-md transition-colors cursor-pointer text-xs',
            showProfit ? 'text-foreground font-medium' : 'text-muted-foreground/40 line-through'
          )}
        >
          <span
            className={cn(
              'size-2 rounded-full transition-opacity',
              showProfit ? 'bg-emerald-500' : 'bg-muted-foreground/30'
            )}
          />
          <span>Laba Kotor</span>
        </button>

        {presetRange !== 'ALL' && hasPreviousPeriod && (
          <button
            type="button"
            onClick={() => setShowComparison(!showComparison)}
            className={cn(
              'flex items-center gap-1.5 py-1 px-2 rounded-md transition-colors cursor-pointer text-xs',
              showComparison
                ? 'text-foreground font-medium'
                : 'text-muted-foreground/40 line-through'
            )}
          >
            <span
              className={cn(
                'w-3.5 border-t border-dashed transition-opacity',
                showComparison
                  ? 'border-zinc-400 dark:border-zinc-500'
                  : 'border-muted-foreground/30'
              )}
            />
            <span>Periode Sebelumnya</span>
          </button>
        )}
      </div>

      <div className="w-full min-w-0 max-w-full h-80 relative pt-1 overflow-hidden">
        <Chart
          type={chartType === 'area' ? 'line' : 'bar'}
          data={mixedChartData}
          options={chartOptions}
          role="img"
          aria-label="Grafik tren penjualan, laba kotor, dan komparasi periode lalu"
        />
      </div>
    </div>
  );
}
