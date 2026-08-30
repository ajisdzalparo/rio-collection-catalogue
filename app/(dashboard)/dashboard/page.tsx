'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Hourglass,
  CreditCard,
  DollarSign,
  AlertCircle,
  ArrowUpRight,
  Eye,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { useOrders, type Order } from '@/hooks/use-orders';
import { useAuth } from '@/hooks/use-auth';
import { Flex, VStack, HStack, Grid } from '@/components/ui/layout';
import { DataTable, type Column } from '@/components/shared/data-table/data-table';
import { DatePicker } from '@/components/ui/date-picker';
import type { DateRange, DatePickerPreset } from '@/types/date-picker.types';
import { subDays, startOfMonth, endOfMonth } from 'date-fns';
import { formatIDR } from '@/lib/utils';

const INDONESIAN_PRESETS: DatePickerPreset[] = [
  {
    label: 'Hari Ini',
    getValue: () => ({ from: new Date(), to: new Date() })
  },
  {
    label: 'Kemarin',
    getValue: () => {
      const y = subDays(new Date(), 1);
      return { from: y, to: y };
    }
  },
  {
    label: '7 Hari Terakhir',
    getValue: () => ({ from: subDays(new Date(), 6), to: new Date() })
  },
  {
    label: '30 Hari Terakhir',
    getValue: () => ({ from: subDays(new Date(), 29), to: new Date() })
  },
  {
    label: 'Bulan Ini',
    getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })
  }
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
    from: subDays(new Date(), 29),
    to: new Date()
  }));

  const dateFilterRange = useMemo(() => {
    if (!dateRange?.from) return {};
    const start = new Date(dateRange.from);
    start.setHours(0, 0, 0, 0);

    const end = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
    end.setHours(23, 59, 59, 999);

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  }, [dateRange]);

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError
  } = useDashboardStats(dateFilterRange);
  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useOrders();

  const loading = statsLoading || ordersLoading;
  const error = statsError || ordersError;

  const recentOrders = useMemo(() => {
    let filtered = [...orders];

    if (dateFilterRange.startDate) {
      const startTime = new Date(dateFilterRange.startDate).getTime();
      filtered = filtered.filter((o) => new Date(o.createdAt).getTime() >= startTime);
    }
    if (dateFilterRange.endDate) {
      const endTime = new Date(dateFilterRange.endDate).getTime();
      filtered = filtered.filter((o) => new Date(o.createdAt).getTime() <= endTime);
    }

    return filtered
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [orders, dateFilterRange]);

  const getStatusBadge = (
    status:
      | 'PENDING'
      | 'CONFIRMED'
      | 'WAITING_PAYMENT'
      | 'PAID'
      | 'FULFILLED'
      | 'REJECTED'
      | 'CANCELLED'
      | 'EXPIRED'
  ) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            Pending
          </Badge>
        );
      case 'CONFIRMED':
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            Confirmed
          </Badge>
        );
      case 'WAITING_PAYMENT':
        return (
          <Badge
            variant="secondary"
            className="bg-purple-500/10 text-purple-500 border-purple-500/20"
          >
            Waiting Payment
          </Badge>
        );
      case 'PAID':
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
          >
            Paid
          </Badge>
        );
      case 'FULFILLED':
        return (
          <Badge variant="secondary" className="bg-gray-500/10 text-gray-400 border-gray-500/20">
            Fulfilled
          </Badge>
        );
      case 'REJECTED':
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const recentOrderColumns: Column<Order>[] = useMemo(
    () => [
      {
        header: 'ID Order',
        accessorKey: 'orderNumber',
        sortable: true,
        className: 'font-bold tracking-mono text-xs'
      },
      {
        header: 'Pelanggan',
        accessorKey: 'fullName',
        sortable: true,
        cell: (order) => (
          <div className="flex flex-col text-xs">
            <span className="font-semibold text-foreground">{order.fullName}</span>
            <span className="text-[10px] text-muted-foreground">+{order.whatsapp}</span>
          </div>
        )
      },
      {
        header: 'Item',
        cell: (order) => (
          <div className="text-muted-foreground text-xs space-y-0.5">
            {order.items.map(
              (item: { name: string; size: string; quantity: number }, idx: number) => (
                <div key={idx}>
                  {item.name} ({item.size}){' '}
                  <span className="font-bold text-foreground">x{item.quantity}</span>
                </div>
              )
            )}
          </div>
        )
      },
      {
        header: 'Total',
        accessorKey: 'totalPrice',
        sortable: true,
        className: 'font-bold text-xs',
        cell: (order) => formatIDR(order.totalPrice)
      },
      {
        header: 'Status',
        accessorKey: 'status',
        sortable: true,
        cell: (order) => getStatusBadge(order.status)
      },
      {
        header: 'Aksi',
        className: 'text-right',
        cell: (order) => (
          <Link
            href={`/dashboard/orders?id=${order.id}`}
            className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Detail Pesanan"
          >
            <Eye className="h-4 w-4" />
          </Link>
        )
      }
    ],
    []
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-foreground" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading dashboard overview...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center text-center p-6 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive animate-bounce" />
        <h3 className="text-lg font-bold text-foreground">Error Loading Overview</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {error instanceof Error
            ? error.message
            : 'Failed to fetch dashboard data. Please try again.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-foreground text-background font-bold text-xs rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Greeting Header */}
      <Flex direction="responsive" justify="between" align="center" gap="md" className="w-full">
        <VStack gap="none">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Halo, {user?.name || 'Ajis'}!
          </h1>
          <p className="text-sm font-semibold text-muted-foreground pt-1">
            Overview toko kaos RIO COLLECTION
          </p>
        </VStack>

        <div className="w-auto">
          <DatePicker
            mode="range"
            align="right"
            rangeValue={dateRange}
            onRangeChange={setDateRange}
            showPresets={true}
            presets={INDONESIAN_PRESETS}
            placeholder="Filter tanggal..."
            className="w-full min-w-60"
          />
        </div>
      </Flex>

      {/* KPI Stats Grid */}
      <Grid cols={4} gap="md">
        {/* Card 1: Total Orders */}
        <VStack gap="md" className="equa-card p-5 justify-between">
          <HStack justify="between" className="w-full">
            <div className="h-10 w-10 rounded-2xl bg-muted/60 text-foreground flex items-center justify-center border border-border/20 shadow-xs">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <HStack gap="xs" className="text-[11px] font-bold text-emerald-500">
              <TrendingUp className="h-3 w-3" />
              <span>+{stats.monthlyGrowth}%</span>
            </HStack>
          </HStack>
          <VStack gap="none">
            <HStack gap="xs" align="baseline">
              <span className="text-3xl font-extrabold text-foreground">{stats.totalOrders}</span>
              <span className="text-xs font-bold text-muted-foreground">pesanan</span>
            </HStack>
            <p className="text-xs font-semibold text-muted-foreground pt-0.5">
              Total order request
            </p>
          </VStack>
        </VStack>

        {/* Card 2: Pending Orders */}
        <VStack gap="md" className="equa-card p-5 justify-between">
          <HStack justify="between" className="w-full">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-xs">
              <Hourglass className="h-5 w-5" />
            </div>
          </HStack>
          <VStack gap="none">
            <HStack gap="xs" align="baseline">
              <span className="text-3xl font-extrabold text-foreground">{stats.pendingOrders}</span>
              <span className="text-xs font-bold text-muted-foreground">pending</span>
            </HStack>
            <p className="text-xs font-semibold text-muted-foreground pt-0.5">
              Menunggu konfirmasi
            </p>
          </VStack>
        </VStack>

        {/* Card 3: Paid Orders */}
        <VStack gap="md" className="equa-card p-5 justify-between">
          <HStack justify="between" className="w-full">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-xs">
              <CreditCard className="h-5 w-5" />
            </div>
          </HStack>
          <VStack gap="none">
            <HStack gap="xs" align="baseline">
              <span className="text-3xl font-extrabold text-foreground">{stats.paidOrders}</span>
              <span className="text-xs font-bold text-muted-foreground">lunas</span>
            </HStack>
            <p className="text-xs font-semibold text-muted-foreground pt-0.5">
              Pembayaran terverifikasi
            </p>
          </VStack>
        </VStack>

        {/* Card 4: Total Revenue */}
        <VStack gap="md" className="equa-card p-5 justify-between">
          <HStack justify="between" className="w-full">
            <div className="h-10 w-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20 shadow-xs">
              <DollarSign className="h-5 w-5" />
            </div>
          </HStack>
          <VStack gap="none">
            <HStack gap="xs" align="baseline">
              <span className="text-xl sm:text-2xl font-black text-foreground">
                {formatIDR(stats.totalRevenue)}
              </span>
            </HStack>
            <p className="text-xs font-semibold text-muted-foreground pt-0.5">
              Total omzet terbayar
            </p>
          </VStack>
        </VStack>
      </Grid>

      {/* Main Grid: Recent Orders + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 Cols): Recent Orders */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Pesanan Terbaru</h3>
              <p className="text-xs font-medium text-muted-foreground pt-0.5">
                Order request yang baru saja masuk
              </p>
            </div>
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Semua Pesanan</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <DataTable
            columns={recentOrderColumns}
            data={recentOrders}
            showSearch={false}
            emptyTitle="Belum Ada Pesanan"
            emptyDescription="Belum ada pesanan masuk yang tersimpan di sistem."
            pageSize={5}
            density="compact"
          />
        </div>

        {/* Right Column (4 Cols): Store Summary & Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick CMS Control Widget */}
          <div className="equa-card p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground font-hanken">Pintasan CMS</h3>
              <p className="text-xs font-medium text-muted-foreground pt-0.5">
                Kelola konten katalog Anda
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href="/dashboard/products"
                className="w-full inline-flex items-center justify-between p-3.5 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/30 transition-all group"
              >
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-foreground">Kaos & Ukuran</span>
                  <span className="text-[10px] text-muted-foreground">
                    Update stok, harga & status kaos
                  </span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>

              <Link
                href="/dashboard/journal"
                className="w-full inline-flex items-center justify-between p-3.5 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/30 transition-all group"
              >
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-foreground">Journal & Editorial</span>
                  <span className="text-[10px] text-muted-foreground">
                    Tulis artikel, drops, & creative story
                  </span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>

          {/* Out of Stock Alert Widget */}
          {stats.outOfStockProducts > 0 && (
            <div className="equa-card p-6 bg-amber-500/5 border-amber-500/20 space-y-3">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertCircle className="h-5 w-5" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Perlu Tindakan</h4>
              </div>
              <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                Terdapat{' '}
                <span className="font-bold text-foreground">{stats.outOfStockProducts} produk aktif</span>{' '}
                yang stoknya habis (0 pcs). Anda bisa mengisikan stok baru atau mengubah statusnya menjadi SOLD OUT di panel Produk CMS.
              </p>
              <Link
                href="/dashboard/products?filter=out_of_stock"
                className="inline-flex px-3.5 py-1.5 bg-amber-500 text-white hover:bg-amber-600 transition-colors text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer"
              >
                Cek Produk
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
