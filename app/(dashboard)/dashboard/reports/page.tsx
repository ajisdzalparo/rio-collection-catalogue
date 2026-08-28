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
  ArrowDownRight
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
import { Order, useOrders } from '@/hooks/use-orders';
import { formatIDR } from '@/lib/utils';
import { toast } from 'sonner';

// Chart.js imports and initialization
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type ChartDataset
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type PeriodFilter = '7D' | '30D' | 'THIS_MONTH' | 'ALL';

function ReportsPageContent() {
  const { data: orders = [] } = useOrders();
  const [period, setPeriod] = useState<PeriodFilter>('7D');
  const [selectedProduct, setSelectedProduct] = useState<string>('ALL');

  // Extract unique product list for filter dropdown
  const availableProducts = useMemo(() => {
    const names = new Set<string>();
    orders.forEach((o) => {
      o.items.forEach((item) => names.add(item.name));
    });
    return Array.from(names);
  }, [orders]);

  // Successful orders list
  const successfulOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status === 'CONFIRMED' || o.status === 'PAID' || o.status === 'FULFILLED'
    );
  }, [orders]);

  // Current Period Orders
  const currentOrders = useMemo(() => {
    const now = new Date();

    return successfulOrders.filter((o) => {
      const orderDate = new Date(o.createdAt);

      if (period === '7D') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return orderDate >= sevenDaysAgo;
      }
      if (period === '30D') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return orderDate >= thirtyDaysAgo;
      }
      if (period === 'THIS_MONTH') {
        return (
          orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()
        );
      }
      return true;
    });
  }, [successfulOrders, period]);

  // Previous Period Orders (for Comparison Analytics)
  const previousOrders = useMemo(() => {
    const now = new Date();

    return successfulOrders.filter((o) => {
      const orderDate = new Date(o.createdAt);

      if (period === '7D') {
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(now.getDate() - 14);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return orderDate >= fourteenDaysAgo && orderDate < sevenDaysAgo;
      }
      if (period === '30D') {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(now.getDate() - 60);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo;
      }
      if (period === 'THIS_MONTH') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return orderDate >= lastMonth && orderDate <= endLastMonth;
      }
      return false;
    });
  }, [successfulOrders, period]);

  const calculateMetrics = useCallback(
    (orderList: typeof successfulOrders) => {
      let revenue = 0;
      let totalHpp = 0;
      let totalQty = 0;

      orderList.forEach((order) => {
        order.items.forEach((item) => {
          if (selectedProduct !== 'ALL' && item.name !== selectedProduct) return;

          const itemRevenue = item.price * item.quantity;
          const itemHppUnit = item.cogs || 180000;
          const itemHppTotal = itemHppUnit * item.quantity;

          revenue += itemRevenue;
          totalHpp += itemHppTotal;
          totalQty += item.quantity;
        });
      });

      const netProfit = revenue - totalHpp;
      const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      return { revenue, totalHpp, netProfit, profitMargin, totalQty };
    },
    [selectedProduct]
  );

  // Current Metrics
  const currentMetrics = useMemo(() => {
    return calculateMetrics(currentOrders);
  }, [calculateMetrics, currentOrders]);

  // Previous Metrics (Comparative Data)
  const previousMetrics = useMemo(() => {
    return calculateMetrics(previousOrders);
  }, [calculateMetrics, previousOrders]);

  // Growth percentage calculation
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
    const daysCount = period === '30D' ? 14 : 7;
    const dates: string[] = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));
    }

    return dates.map((dateStr, idx) => {
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

      // Previous period revenue mapping for comparison line
      if (previousOrders.length > 0) {
        const prevDateStr = new Date(
          new Date().setDate(new Date().getDate() - (daysCount + (daysCount - 1 - idx)))
        ).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

        previousOrders.forEach((o) => {
          const orderDate = new Date(o.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short'
          });
          if (orderDate === prevDateStr) {
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

  // Chart.js Datasets Configuration
  const lineChartData = useMemo(() => {
    const datasets: ChartDataset<'line'>[] = [
      {
        label: 'Omset Periode Ini',
        data: chartDataPoints.map((d) => d.revenue),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'Laba Kotor Periode Ini',
        data: chartDataPoints.map((d) => d.profit),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ];

    // Add Comparison Dataset if Previous Period Data Available
    if (period !== 'ALL') {
      datasets.push({
        label: 'Omset Periode Lalu (Komparasi)',
        data: chartDataPoints.map((d) => d.prevRevenue),
        borderColor: '#a855f7',
        borderDash: [5, 5],
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.35,
        pointBackgroundColor: '#a855f7',
        pointRadius: 3
      });
    }

    return {
      labels: chartDataPoints.map((d) => d.label),
      datasets
    };
  }, [chartDataPoints, period]);

  // Chart.js Options
  const lineChartOptions: ChartOptions<'line'> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            font: {
              size: 11,
              weight: 'bold'
            }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          padding: 10,
          boxPadding: 4,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y || 0;
              return `${label}: ${formatIDR(value)}`;
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
              size: 10,
              weight: 'bold'
            }
          }
        },
        y: {
          border: {
            dash: [4, 4]
          },
          grid: {
            color: 'rgba(120, 120, 128, 0.15)'
          },
          ticks: {
            font: {
              size: 10
            },
            callback: (val) => {
              const num = Number(val);
              if (num >= 1000000) return `${(num / 1000000).toFixed(1)}jt`;
              if (num >= 1000) return `${(num / 1000).toFixed(0)}rb`;
              return num;
            }
          }
        }
      }
    };
  }, []);

  // Export CSV Function with Filtered Data
  const handleExportCSV = () => {
    if (currentOrders.length === 0) {
      toast.error('Tidak ada data penjualan pada periode dan produk ini.');
      return;
    }

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

    currentOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (selectedProduct !== 'ALL' && item.name !== selectedProduct) return;

        const rev = item.price * item.quantity;
        const hpp = (item.cogs || 180000) * item.quantity;
        const profit = rev - hpp;
        const dateStr = new Date(o.createdAt).toLocaleDateString('id-ID');

        rows.push(
          [
            `"${o.orderNumber}"`,
            `"${dateStr}"`,
            `"${o.fullName}"`,
            `"${o.status}"`,
            `"${item.name}"`,
            item.quantity,
            rev,
            hpp,
            profit
          ].join(',')
        );
      });
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filterTag = selectedProduct !== 'ALL' ? selectedProduct.replace(/\s+/g, '_') : 'Semua';
    link.setAttribute('download', `Laporan_Penjualan_${filterTag}_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Laporan penjualan CSV berhasil diunduh!');
  };

  return (
    <VStack gap="lg" className="w-full pb-10">
      {/* Header & Controls Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Laporan Keuangan
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
          <p className="text-sm text-muted-foreground pt-0.5">
            Pantau ringkasan omset, komparasi periode, serta analisis per produk toko RIO
            COLLECTION.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* Product Filter Selector */}
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

          {/* Period Filter Selector */}
          <div className="flex items-center gap-2 bg-card border border-border/50 rounded-xl px-3 py-1 shadow-2xs">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={period} onValueChange={(val) => val && setPeriod(val as PeriodFilter)}>
              <SelectTrigger className="h-8 border-none bg-transparent shadow-none text-xs font-bold w-36 focus:ring-0">
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="7D">7 Hari Terakhir</SelectItem>
                <SelectItem value="30D">30 Hari Terakhir</SelectItem>
                <SelectItem value="THIS_MONTH">Bulan Ini</SelectItem>
                <SelectItem value="ALL">Semua Waktu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export CSV Button */}
          <Button
            onClick={handleExportCSV}
            className="gap-2 h-10 rounded-xl font-bold uppercase tracking-wider text-xs cursor-pointer shadow-xs"
          >
            <Download className="h-4 w-4" />
            <span>Ekspor CSV</span>
          </Button>
        </div>
      </div>

      <div className="w-full space-y-6">
        {/* Metrics Summary Cards with Comparison Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {/* Revenue card */}
          <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-3 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">
                Revenue / Omset
              </span>
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Receipt className="h-4 w-4 text-blue-500" />
              </div>
            </div>
            <h3 className="text-xl font-black text-foreground tabular-nums">
              {formatIDR(currentMetrics.revenue)}
            </h3>
            <div className="flex items-center justify-between pt-1">
              <p className="text-[9px] text-muted-foreground/70 leading-normal">
                {currentMetrics.totalQty} pcs terjual
              </p>
              {period !== 'ALL' && (
                <div
                  className={`flex items-center gap-0.5 text-[10px] font-bold ${
                    growth.revenue >= 0 ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {growth.revenue >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  <span>{Math.abs(growth.revenue).toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>

          {/* HPP total card */}
          <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-3 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">
                Total HPP (COGS)
              </span>
              <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Coins className="h-4 w-4 text-amber-500" />
              </div>
            </div>
            <h3 className="text-xl font-black text-foreground tabular-nums">
              {formatIDR(currentMetrics.totalHpp)}
            </h3>
            <p className="text-[9px] text-muted-foreground/70 leading-normal">
              Akumulasi modal produksi baju terjual.
            </p>
          </div>

          {/* Net profit card */}
          <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-3 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">
                Laba Kotor / Profit
              </span>
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
            <h3 className="text-xl font-black text-foreground tabular-nums">
              {formatIDR(currentMetrics.netProfit)}
            </h3>
            <div className="flex items-center justify-between pt-1">
              <p className="text-[9px] text-muted-foreground/70 leading-normal">
                Sisa bersih keuntungan kotor
              </p>
              {period !== 'ALL' && (
                <div
                  className={`flex items-center gap-0.5 text-[10px] font-bold ${
                    growth.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {growth.profit >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  <span>{Math.abs(growth.profit).toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Profit margin card */}
          <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-3 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">
                Profit Margin (%)
              </span>
              <div className="h-7 w-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Percent className="h-4 w-4 text-purple-500" />
              </div>
            </div>
            <h3 className="text-xl font-black text-foreground tabular-nums">
              {currentMetrics.profitMargin.toFixed(1)}%
            </h3>
            <p className="text-[9px] text-muted-foreground/70 leading-normal">
              Rasio efisiensi margin keuntungan kotor.
            </p>
          </div>
        </div>

        {/* Chart & Detailed Log Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Chart.js Line Chart Display (8 cols) */}
          <div className="lg:col-span-8 bg-card border border-border/40 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border/10 pb-3 flex-wrap gap-2">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Analisis Tren Penjualan & Komparasi
                </h4>
                <p className="text-[10px] text-muted-foreground">
                  {selectedProduct === 'ALL'
                    ? 'Menampilkan grafik pergerakan omset & laba seluruh produk'
                    : `Analisis spesifik produk: ${selectedProduct}`}
                </p>
              </div>
            </div>

            {/* Interactive Chart.js canvas */}
            <div className="w-full h-72 relative pt-2">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>

          {/* Sales breakdown summary (4 cols) */}
          <div className="lg:col-span-4 bg-card border border-border/40 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xs h-full">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border/10 pb-3 flex items-center gap-1.5 shrink-0">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground/75" />
              Catatan Rincian Penjualan
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
                    className="border border-border/20 p-3 rounded-xl space-y-2 bg-muted/10"
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
                const rankColor =
                  idx === 0
                    ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                    : idx === 1
                      ? 'bg-slate-400/15 text-slate-600 border-slate-400/30'
                      : idx === 2
                        ? 'bg-amber-700/15 text-amber-800 border-amber-700/30'
                        : 'bg-muted text-muted-foreground border-border/40';

                return (
                  <div
                    key={p.name}
                    className="border border-border/30 rounded-xl p-3 space-y-2 bg-card/60 flex flex-col justify-between hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded-md border text-[10px] font-black tracking-wider ${rankColor}`}
                      >
                        #{idx + 1}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-extrabold text-foreground">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{p.totalQty} Pcs</span>
                      </div>
                    </div>

                    <div className="space-y-0.5 pt-1">
                      <h5 className="text-xs font-bold text-foreground line-clamp-1">{p.name}</h5>
                      <p className="text-[10px] font-medium text-emerald-500">
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
