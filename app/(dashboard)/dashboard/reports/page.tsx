'use client';

import React, { useState, useMemo, useCallback, Suspense } from 'react';
import {
  TrendingUp,
  Coins,
  Receipt,
  Percent,
  FileSpreadsheet,
  Download,
  Calendar,
  Flame,
  Package,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  LineChart,
  Sparkles,
  Eye,
  EyeOff,
  Activity,
  CalendarDays,
  Trophy,
  ShoppingBag
} from 'lucide-react';
import { VStack } from '@/components/ui/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useOrders } from '@/hooks/use-orders';
import { formatIDR } from '@/lib/utils';
import { toast } from 'sonner';

// Chart.js imports and initialization
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

type PeriodFilter = '7D' | '30D' | 'THIS_MONTH' | 'ALL';

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  '7D': '7 Hari Terakhir',
  '30D': '30 Hari Terakhir',
  THIS_MONTH: 'Bulan Ini',
  ALL: 'Semua Waktu'
};

function ReportsPageContent() {
  const { data: orders = [] } = useOrders();
  const [period, setPeriod] = useState<PeriodFilter>('7D');
  const [selectedProduct, setSelectedProduct] = useState<string>('ALL');
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [showRevenue, setShowRevenue] = useState(true);
  const [showProfit, setShowProfit] = useState(true);
  const [showComparison, setShowComparison] = useState(true);

  // Extract unique product list for filter dropdown
  const availableProducts = useMemo(() => {
    const names = new Set<string>();
    orders.forEach((o) => {
      o.items.forEach((item) => names.add(item.name));
    });
    return Array.from(names);
  }, [orders]);

  // Filter Orders by Period
  const { currentOrders, previousOrders } = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let prevStartDate: Date;
    let prevEndDate: Date;

    if (period === '7D') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      prevEndDate = new Date(startDate.getTime());
      prevStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '30D') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      prevEndDate = new Date(startDate.getTime());
      prevStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === 'THIS_MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      prevEndDate = new Date(startDate.getTime() - 1);
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    } else {
      // ALL
      startDate = new Date(0);
      prevEndDate = new Date(0);
      prevStartDate = new Date(0);
    }

    const current = orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= startDate && d <= now;
    });

    const previous =
      period === 'ALL'
        ? []
        : orders.filter((o) => {
            const d = new Date(o.createdAt);
            return d >= prevStartDate && d <= prevEndDate;
          });

    return { currentOrders: current, previousOrders: previous };
  }, [orders, period]);

  // Calculate Metrics (Revenue, HPP, Profit, Margin)
  const calculateMetrics = (orderList: typeof orders) => {
    let revenue = 0;
    let totalHpp = 0;
    let totalQty = 0;

    orderList.forEach((o) => {
      o.items.forEach((item) => {
        if (selectedProduct !== 'ALL' && item.name !== selectedProduct) return;

        const rev = item.price * item.quantity;
        const hpp = (item.cogs || 180000) * item.quantity;
        revenue += rev;
        totalHpp += hpp;
        totalQty += item.quantity;
      });
    });

    const netProfit = revenue - totalHpp;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return { revenue, totalHpp, netProfit, profitMargin, totalQty };
  };

  const currentMetrics = useMemo(
    () => calculateMetrics(currentOrders),
    [currentOrders, selectedProduct]
  );
  const previousMetrics = useMemo(
    () => calculateMetrics(previousOrders),
    [previousOrders, selectedProduct]
  );

  // Growth percentages
  const growth = useMemo(() => {
    const calcGrowth = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    return {
      revenue: calcGrowth(currentMetrics.revenue, previousMetrics.revenue),
      profit: calcGrowth(currentMetrics.netProfit, previousMetrics.netProfit),
      qty: calcGrowth(currentMetrics.totalQty, previousMetrics.totalQty)
    };
  }, [currentMetrics, previousMetrics]);

  // Top Selling Kaos Products (Filtered by Period)
  const topProducts = useMemo(() => {
    const map = new Map<
      string,
      { name: string; totalQty: number; revenue: number; profit: number }
    >();

    currentOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (selectedProduct !== 'ALL' && item.name !== selectedProduct) return;

        const key = item.name;
        const rev = item.price * item.quantity;
        const hpp = (item.cogs || 180000) * item.quantity;
        const profit = rev - hpp;

        const current = map.get(key) || { name: item.name, totalQty: 0, revenue: 0, profit: 0 };
        map.set(key, {
          name: item.name,
          totalQty: current.totalQty + item.quantity,
          revenue: current.revenue + rev,
          profit: current.profit + profit
        });
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 5);
  }, [currentOrders, selectedProduct]);

  // Chart data points per day for Current vs Previous Period
  const chartDataPoints = useMemo(() => {
    let daysCount = 7;
    if (period === '30D' || period === 'ALL') daysCount = 30;
    if (period === 'THIS_MONTH') {
      const now = new Date();
      daysCount = Math.max(7, now.getDate());
    }

    const dates: { dateStr: string; fullDate: Date; prevDate: Date }[] = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const prevD = new Date();
      prevD.setDate(prevD.getDate() - (daysCount + i));

      dates.push({
        dateStr: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        fullDate: d,
        prevDate: prevD
      });
    }

    return dates.map(({ dateStr, prevDate }) => {
      let dailyRevenue = 0;
      let dailyProfit = 0;
      let prevDailyRevenue = 0;

      // Current period revenue
      currentOrders.forEach((o) => {
        const orderDate = new Date(o.createdAt).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short'
        });
        if (orderDate === dateStr) {
          o.items.forEach((item) => {
            if (selectedProduct !== 'ALL' && item.name !== selectedProduct) return;
            const rev = item.price * item.quantity;
            const hpp = (item.cogs || 180000) * item.quantity;
            dailyRevenue += rev;
            dailyProfit += rev - hpp;
          });
        }
      });

      // Previous period revenue mapping
      if (previousOrders.length > 0) {
        const prevTargetStr = prevDate.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short'
        });

        previousOrders.forEach((o) => {
          const orderDate = new Date(o.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short'
          });
          if (orderDate === prevTargetStr) {
            o.items.forEach((item) => {
              if (selectedProduct !== 'ALL' && item.name !== selectedProduct) return;
              prevDailyRevenue += item.price * item.quantity;
            });
          }
        });
      }

      return {
        label: dateStr,
        revenue: dailyRevenue,
        profit: dailyProfit,
        prevRevenue: prevDailyRevenue
      };
    });
  }, [currentOrders, previousOrders, period, selectedProduct]);

  // Executive Insights for Business Owner
  const chartInsights = useMemo(() => {
    let peakRevenue = 0;
    let peakLabel = '-';
    let totalRev = 0;
    let daysWithSales = 0;

    chartDataPoints.forEach((d) => {
      totalRev += d.revenue;
      if (d.revenue > peakRevenue) {
        peakRevenue = d.revenue;
        peakLabel = d.label;
      }
      if (d.revenue > 0) daysWithSales++;
    });

    const avgDaily = chartDataPoints.length > 0 ? totalRev / chartDataPoints.length : 0;

    return {
      peakRevenue,
      peakLabel,
      avgDaily,
      daysWithSales,
      totalPoints: chartDataPoints.length
    };
  }, [chartDataPoints]);

  // Chart.js Datasets Configuration with Combo Bar & Line Support
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
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 34,
          order: 2
        });
      } else {
        datasets.push({
          type: 'line',
          label: 'Omset Periode Ini',
          data: chartDataPoints.map((d) => d.revenue),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.16)',
          fill: true,
          tension: 0.38,
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
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
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 34,
          order: 3
        });
      } else {
        datasets.push({
          type: 'line',
          label: 'Laba Kotor',
          data: chartDataPoints.map((d) => d.profit),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          fill: true,
          tension: 0.38,
          borderWidth: 2,
          pointRadius: 3.5,
          pointHoverRadius: 5.5,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          order: 3
        });
      }
    }

    // Dataset 3: Comparison Line (Omset Periode Lalu)
    if (showComparison && period !== 'ALL') {
      datasets.push({
        type: 'line',
        label: 'Komparasi Periode Lalu',
        data: chartDataPoints.map((d) => d.prevRevenue),
        borderColor: '#a855f7',
        borderWidth: 2,
        borderDash: [6, 6],
        pointRadius: 3,
        pointHoverRadius: 5.5,
        pointBackgroundColor: '#a855f7',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        fill: false,
        tension: 0.35,
        order: 1
      });
    }

    return {
      labels: chartDataPoints.map((d) => d.label),
      datasets
    };
  }, [chartDataPoints, period, chartType, showRevenue, showProfit, showComparison]);

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
          backgroundColor: 'rgba(15, 23, 42, 0.96)',
          titleColor: '#f8fafc',
          titleFont: {
            size: 12,
            weight: 'bold'
          },
          bodyColor: '#e2e8f0',
          bodyFont: {
            size: 11
          },
          borderColor: 'rgba(255, 255, 255, 0.15)',
          borderWidth: 1,
          padding: 14,
          cornerRadius: 14,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            title: (items) => {
              if (!items.length) return '';
              return `Tanggal: ${items[0].label}`;
            },
            label: (context) => {
              const label = context.dataset.label || '';
              const value = Number(context.parsed.y || 0);
              return ` ${label}: ${formatIDR(value)}`;
            },
            afterBody: (items) => {
              const revItem = items.find((i) => i.dataset.label?.includes('Omset Periode Ini'));
              const profitItem = items.find((i) => i.dataset.label?.includes('Laba Kotor'));
              if (revItem && profitItem) {
                const rev = Number(revItem.parsed.y || 0);
                const profit = Number(profitItem.parsed.y || 0);
                if (rev > 0) {
                  const margin = ((profit / rev) * 100).toFixed(1);
                  return [`Margin Laba: ${margin}%`];
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
          ticks: {
            font: {
              size: 11,
              weight: 'bold'
            },
            color: 'rgba(148, 163, 184, 0.9)'
          }
        },
        y: {
          beginAtZero: true,
          border: {
            dash: [4, 4]
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.08)'
          },
          ticks: {
            font: {
              size: 10,
              weight: 'bold'
            },
            color: 'rgba(148, 163, 184, 0.85)',
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

  // Export CSV Function with Filtered Data
  const handleExportCsv = () => {
    if (currentOrders.length === 0) {
      toast.error('Tidak ada data penjualan pada periode dan produk ini.');
      return;
    }

    const delimiter = ',';
    const headers = [
      'ID Order',
      'Tanggal',
      'Nama Pelanggan',
      'Status',
      'Nama Produk',
      'Jumlah Item (Pcs)',
      'Total Omset (IDR)',
      'Total HPP (IDR)',
      'Laba Kotor (IDR)'
    ];

    const rows: string[] = [];

    const cleanField = (val: unknown) => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    currentOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (selectedProduct !== 'ALL' && item.name !== selectedProduct) return;

        const rev = item.price * item.quantity;
        const hpp = (item.cogs || 180000) * item.quantity;
        const profit = rev - hpp;
        const dateStr = new Date(o.createdAt).toLocaleDateString('id-ID');

        rows.push(
          [
            cleanField(o.orderNumber),
            cleanField(dateStr),
            cleanField(o.fullName),
            cleanField(o.status),
            cleanField(item.name),
            cleanField(item.quantity),
            cleanField(rev),
            cleanField(hpp),
            cleanField(profit)
          ].join(delimiter)
        );
      });
    });

    const csvLines = [headers.map(cleanField).join(delimiter), ...rows];
    const csvContent = '\uFEFF' + csvLines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Laporan_Penjualan_RIO_${period}_${selectedProduct.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Laporan CSV berhasil diunduh.');
  };

  return (
    <VStack gap="lg" className="w-full pb-12">
      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Laporan Keuangan & Penjualan
            </h1>
            {selectedProduct !== 'ALL' && (
              <Badge
                variant="secondary"
                className="text-xs font-bold bg-primary/10 text-primary border-primary/20"
              >
                Filter: {selectedProduct}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Ringkasan performa bisnis dan analisis tren produk.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 bg-card border border-border/50 rounded-xl px-3 py-1 shadow-2xs">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={selectedProduct} onValueChange={(val) => val && setSelectedProduct(val)}>
              <SelectTrigger className="h-8 border-none bg-transparent shadow-none text-xs font-bold min-w-36 max-w-48 focus:ring-0">
                <SelectValue placeholder="Semua Produk" />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-60">
                <SelectItem value="ALL">Semua Produk Kaos</SelectItem>
                {availableProducts.map((pName) => (
                  <SelectItem key={pName} value={pName}>
                    {pName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 bg-card border border-border/50 rounded-xl px-3 py-1 shadow-2xs">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={period} onValueChange={(val) => val && setPeriod(val as PeriodFilter)}>
              <SelectTrigger className="h-8 border-none bg-transparent shadow-none text-xs font-bold w-36 focus:ring-0">
                <SelectValue placeholder="Pilih Periode">{PERIOD_LABELS[period]}</SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="7D">7 Hari Terakhir</SelectItem>
                <SelectItem value="30D">30 Hari Terakhir</SelectItem>
                <SelectItem value="THIS_MONTH">Bulan Ini</SelectItem>
                <SelectItem value="ALL">Semua Waktu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleExportCsv}
            className="gap-2 h-9 rounded-xl px-5 font-bold uppercase tracking-wider text-[10px] shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Ekspor CSV</span>
          </Button>
        </div>
      </div>

      <div className="w-full space-y-6">
        {/* Metrics Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Revenue
              </span>
              <Receipt className="h-4 w-4 text-blue-500" />
            </div>
            <h3 className="text-xl font-black text-foreground tabular-nums">
              {formatIDR(currentMetrics.revenue)}
            </h3>
            {period !== 'ALL' && (
              <p
                className={`text-[10px] font-bold ${growth.revenue >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
              >
                {growth.revenue >= 0 ? '+' : ''}
                {growth.revenue.toFixed(1)}% vs lalu
              </p>
            )}
          </div>
          <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-2 shadow-2xs">
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
          <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Laba Kotor
              </span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <h3 className="text-xl font-black text-foreground tabular-nums">
              {formatIDR(currentMetrics.netProfit)}
            </h3>
            {period !== 'ALL' && (
              <p
                className={`text-[10px] font-bold ${growth.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
              >
                {growth.profit >= 0 ? '+' : ''}
                {growth.profit.toFixed(1)}% vs lalu
              </p>
            )}
          </div>
          <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-2 shadow-2xs">
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

        {/* Chart & Detailed Log Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8 bg-card border border-border/40 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border/10 pb-3.5 flex-wrap gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Analisis Tren Penjualan & Komparasi
                  </h4>
                  <Badge variant="outline" className="text-[10px] py-0 px-2 font-mono">
                    {PERIOD_LABELS[period]}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {selectedProduct === 'ALL'
                    ? 'Perbandingan omset, laba kotor, dan komparasi periode sebelumnya'
                    : `Analisis spesifik produk: ${selectedProduct}`}
                </p>
              </div>

              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40">
                <button
                  type="button"
                  onClick={() => setChartType('bar')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    chartType === 'bar'
                      ? 'bg-card text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>Batang</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('area')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    chartType === 'area'
                      ? 'bg-card text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <LineChart className="h-3.5 w-3.5" />
                  <span>Tren Area</span>
                </button>
              </div>
            </div>

            {/* KPI Mini Insight Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-muted/25 hover:bg-muted/35 border border-border/40 rounded-xl p-3 flex items-center gap-3 transition-colors">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Puncak Penjualan
                  </span>
                  <p className="text-xs font-bold text-foreground truncate">
                    {chartInsights.peakRevenue > 0
                      ? `${chartInsights.peakLabel} • ${formatIDR(chartInsights.peakRevenue)}`
                      : 'Belum ada transaksi'}
                  </p>
                </div>
              </div>

              <div className="bg-muted/25 hover:bg-muted/35 border border-border/40 rounded-xl p-3 flex items-center gap-3 transition-colors">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Rata-rata / Hari
                  </span>
                  <p className="text-xs font-bold text-foreground tabular-nums truncate">
                    {formatIDR(chartInsights.avgDaily)}
                  </p>
                </div>
              </div>

              <div className="bg-muted/25 hover:bg-muted/35 border border-border/40 rounded-xl p-3 flex items-center gap-3 transition-colors">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Hari Transaksi Aktif
                  </span>
                  <p className="text-xs font-bold text-foreground tabular-nums truncate">
                    {chartInsights.daysWithSales} dari {chartInsights.totalPoints} hari
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Dataset Toggle Legend */}
            <div className="flex items-center justify-start sm:justify-end gap-2 flex-wrap pt-1 border-t border-border/10">
              <button
                type="button"
                onClick={() => setShowRevenue(!showRevenue)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  showRevenue
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 shadow-2xs'
                    : 'bg-muted/20 text-muted-foreground/60 border-border/30 hover:text-muted-foreground'
                }`}
              >
                <span
                  className={`size-2 rounded-full transition-colors ${
                    showRevenue ? 'bg-blue-500 shadow-xs' : 'bg-muted-foreground/30'
                  }`}
                />
                <span>Omset Periode Ini</span>
                {showRevenue ? (
                  <Eye className="size-3.5 opacity-70 ml-0.5" />
                ) : (
                  <EyeOff className="size-3.5 opacity-50 ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowProfit(!showProfit)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  showProfit
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-2xs'
                    : 'bg-muted/20 text-muted-foreground/60 border-border/30 hover:text-muted-foreground'
                }`}
              >
                <span
                  className={`size-2 rounded-full transition-colors ${
                    showProfit ? 'bg-emerald-500 shadow-xs' : 'bg-muted-foreground/30'
                  }`}
                />
                <span>Laba Kotor</span>
                {showProfit ? (
                  <Eye className="size-3.5 opacity-70 ml-0.5" />
                ) : (
                  <EyeOff className="size-3.5 opacity-50 ml-0.5" />
                )}
              </button>

              {period !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setShowComparison(!showComparison)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    showComparison
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 shadow-2xs'
                      : 'bg-muted/20 text-muted-foreground/60 border-border/30 hover:text-muted-foreground'
                  }`}
                >
                  <span
                    className={`h-0.5 w-3.5 border-t-2 border-dashed transition-colors ${
                      showComparison ? 'border-purple-500' : 'border-muted-foreground/40'
                    }`}
                  />
                  <span>Komparasi Periode Lalu</span>
                  {showComparison ? (
                    <Eye className="size-3.5 opacity-70 ml-0.5" />
                  ) : (
                    <EyeOff className="size-3.5 opacity-50 ml-0.5" />
                  )}
                </button>
              )}
            </div>

            <div className="w-full h-80 relative pt-2">
              <Chart
                type={chartType === 'area' ? 'line' : 'bar'}
                data={mixedChartData}
                options={chartOptions}
                role="img"
                aria-label="Grafik tren penjualan, laba kotor, dan komparasi periode lalu"
              />
            </div>
          </div>

          <div className="lg:col-span-4 bg-card border border-border/40 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xs h-full">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border/10 pb-3 flex items-center gap-2 shrink-0">
              <Receipt className="h-4 w-4 text-primary" />
              <span>Catatan Rincian Penjualan</span>
            </h4>

            <div className="space-y-3 flex-1 min-h-70 max-h-80 overflow-y-auto pr-1">
              {currentOrders.map((o) => {
                const matchingItems = o.items.filter(
                  (item) => selectedProduct === 'ALL' || item.name === selectedProduct
                );
                if (matchingItems.length === 0) return null;

                let orderRevenue = 0;
                let orderHpp = 0;
                matchingItems.forEach((item) => {
                  orderRevenue += item.price * item.quantity;
                  orderHpp += (item.cogs || 180000) * item.quantity;
                });
                const profit = orderRevenue - orderHpp;

                return (
                  <div
                    key={o.id}
                    className="border border-border/25 p-3.5 rounded-xl space-y-2 bg-muted/15 hover:bg-muted/25 transition-colors"
                  >
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="font-mono text-foreground">{o.orderNumber}</span>
                      <span className="text-muted-foreground">
                        {new Date(o.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {matchingItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground truncate max-w-36">
                            {item.name}
                          </span>
                          <span className="font-bold text-foreground">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between border-t border-border/15 pt-1.5 text-[11px] font-bold">
                      <span className="text-muted-foreground">Untung:</span>
                      <span className="text-emerald-500 font-extrabold">{formatIDR(profit)}</span>
                    </div>
                  </div>
                );
              })}
              {currentOrders.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  Belum ada order pada filter produk & periode ini.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Best-Selling Kaos Section */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-4 shadow-2xs w-full">
          <div className="flex items-center justify-between border-b border-border/10 pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span>
                {selectedProduct === 'ALL'
                  ? 'Top 5 Kaos Terlaris Periode Ini'
                  : `Analisis Produk: ${selectedProduct}`}
              </span>
            </h4>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">
              Berdasarkan Kuantitas Terjual
            </span>
          </div>

          {topProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {topProducts.map((p, idx) => {
                const rankBadge =
                  idx === 0 ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black tracking-wider">
                      <Trophy className="h-3 w-3" />
                      <span>#1</span>
                    </span>
                  ) : idx === 1 ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-400/30 bg-slate-400/15 text-slate-600 dark:text-slate-300 text-[10px] font-black tracking-wider">
                      <span>#2</span>
                    </span>
                  ) : idx === 2 ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-700/30 bg-amber-700/15 text-amber-800 dark:text-amber-500 text-[10px] font-black tracking-wider">
                      <span>#3</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-border/40 bg-muted/40 text-muted-foreground text-[10px] font-bold">
                      <span>#{idx + 1}</span>
                    </span>
                  );

                return (
                  <div
                    key={p.name}
                    className="border border-border/30 rounded-xl p-3.5 space-y-2.5 bg-card/60 hover:bg-muted/10 flex flex-col justify-between hover:border-primary/30 transition-all shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      {rankBadge}
                      <div className="flex items-center gap-1 text-[11px] font-extrabold text-foreground">
                        <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{p.totalQty} Pcs</span>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <h5 className="text-xs font-bold text-foreground line-clamp-1">{p.name}</h5>
                      <p className="text-[11px] font-extrabold text-emerald-500">
                        {formatIDR(p.revenue)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-muted-foreground">
              Belum ada data kaos terjual pada periode ini.
            </div>
          )}
        </div>
      </div>
    </VStack>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-foreground" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading selling reports...</p>
        </div>
      }
    >
      <ReportsPageContent />
    </Suspense>
  );
}
