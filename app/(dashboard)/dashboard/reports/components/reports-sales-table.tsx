'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ReceiptText, Tag } from 'lucide-react';
import { DataTable, type Column } from '@/components/shared/data-table/data-table';
import { OrderStatusBadge } from '@/components/shared/order-status-badge';
import { Badge } from '@/components/ui/badge';
import { formatIDR } from '@/lib/utils';
import type { Order } from '@/hooks/use-orders';
import { netItemRevenues } from '@/lib/referral';

interface ReportsSalesTableProps {
  currentOrders: Order[];
  selectedProducts: string[];
}

interface ReportTableRow {
  id: string;
  orderId: string;
  createdAt: string;
  orderNumber: string;
  customer: string;
  product: string;
  size: string;
  quantity: number;
  grossSales: number;
  discount: number;
  referralCode: string | null;
  referralPartner: string | null;
  sales: number;
  cogs: number;
  grossProfit: number;
  referralReward: number;
  netProfit: number;
  status: Order['status'];
  referralPayoutId: string | null;
}

export function ReportsSalesTable({ currentOrders, selectedProducts }: ReportsSalesTableProps) {
  const rows = useMemo<ReportTableRow[]>(
    () =>
      currentOrders.flatMap((order) => {
        const revenues = netItemRevenues(order.items, order.discountAmount ?? 0);
        const totalGrossOrder = order.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        return order.items
          .map((item, index) => ({ item, index }))
          .filter(
            ({ item }) => selectedProducts.length === 0 || selectedProducts.includes(item.name)
          )
          .map(({ item, index }) => {
            const grossItem = item.price * item.quantity;
            const sales = revenues[index];
            const discount = Math.max(0, grossItem - sales);
            const cogs = (item.cogs ?? 0) * item.quantity;
            const grossProfit = sales - cogs;

            // Alokasikan komisi cash proporsional terhadap nilai kotor item dalam order
            const itemRatio = totalGrossOrder > 0 ? grossItem / totalGrossOrder : 0;
            const referralReward = Math.round((order.referralRewardAmount ?? 0) * itemRatio);
            const netProfit = grossProfit - referralReward;

            return {
              id: `${order.id}-${index}`,
              orderId: order.id,
              createdAt: order.createdAt,
              orderNumber: order.orderNumber,
              customer: order.fullName,
              product: item.name,
              size: item.size,
              quantity: item.quantity,
              grossSales: grossItem,
              discount,
              referralCode: order.referralCodeSnapshot || null,
              referralPartner: order.referralPartnerSnapshot || null,
              sales,
              cogs,
              grossProfit,
              referralReward,
              netProfit,
              status: order.status,
              referralPayoutId: order.referralPayoutId || null
            };
          });
      }),
    [currentOrders, selectedProducts]
  );

  const columns = useMemo<Column<ReportTableRow>[]>(
    () => [
      {
        header: 'Tanggal',
        accessorKey: 'createdAt',
        sortable: true,
        cell: (row) =>
          new Date(row.createdAt).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
      },
      {
        header: 'No. Pesanan',
        accessorKey: 'orderNumber',
        sortable: true,
        cell: (row) => (
          <Link
            href={`/dashboard/orders/${row.orderId}`}
            className="font-mono text-xs font-bold text-primary hover:underline"
          >
            {row.orderNumber}
          </Link>
        )
      },
      { header: 'Pelanggan', accessorKey: 'customer', sortable: true },
      { header: 'Produk', accessorKey: 'product', sortable: true },
      { header: 'Ukuran', accessorKey: 'size', className: 'text-center' },
      { header: 'Qty', accessorKey: 'quantity', className: 'text-right', sortable: true },
      {
        header: 'Harga Kotor',
        accessorKey: 'grossSales',
        className: 'text-right',
        sortable: true,
        cell: (row) => formatIDR(row.grossSales)
      },
      {
        header: 'Diskon',
        accessorKey: 'discount',
        className: 'text-right',
        sortable: true,
        cell: (row) =>
          row.discount > 0 ? (
            <span className="text-rose-600 dark:text-rose-400 font-semibold">
              -{formatIDR(row.discount)}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )
      },
      {
        header: 'Kode Referral',
        accessorKey: 'referralCode',
        cell: (row) =>
          row.referralCode ? (
            <div className="flex flex-col">
              <Badge
                variant="outline"
                className="font-mono text-[10px] w-fit border-primary/30 text-primary"
              >
                {row.referralCode}
              </Badge>
              {row.referralPartner && (
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {row.referralPartner}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          )
      },
      {
        header: 'Penjualan Bersih',
        accessorKey: 'sales',
        className: 'text-right font-semibold',
        sortable: true,
        cell: (row) => formatIDR(row.sales)
      },
      {
        header: 'HPP',
        accessorKey: 'cogs',
        className: 'text-right',
        sortable: true,
        cell: (row) => formatIDR(row.cogs)
      },
      {
        header: 'Komisi Referral',
        accessorKey: 'referralReward',
        className: 'text-right',
        sortable: true,
        cell: (row) =>
          row.referralReward > 0 ? (
            <div className="flex flex-col items-end">
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                {formatIDR(row.referralReward)}
              </span>
              <span className="text-[9px] text-muted-foreground">
                {row.referralPayoutId ? 'Sudah Ditransfer' : 'Belum Ditransfer'}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          )
      },
      {
        header: 'Laba Bersih',
        accessorKey: 'netProfit',
        className: 'text-right font-bold',
        sortable: true,
        cell: (row) => (
          <span
            className={
              row.netProfit >= 0
                ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                : 'text-rose-600 font-extrabold'
            }
          >
            {formatIDR(row.netProfit)}
          </span>
        )
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: (row) => <OrderStatusBadge status={row.status} className="px-2 py-0.5 text-[9px]" />
      }
    ],
    []
  );

  return (
    <section className="space-y-4 rounded-xl border border-border/40 bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-border/20 pb-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <ReceiptText className="h-4 w-4 text-primary" />
          Tabel Rincian Laporan Penjualan & Referral
        </h2>
        <span className="text-xs font-semibold text-muted-foreground">
          {rows.length} baris transaksi
        </span>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        searchKey="orderNumber"
        extraSearchKeys={
          ['customer', 'product', 'referralCode', 'referralPartner'] as Array<keyof ReportTableRow>
        }
        searchPlaceholder="Cari pesanan, pelanggan, produk, kode, atau partner..."
        searchParamKey="reportSearch"
        pageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        density="compact"
        striped
        emptyTitle="Belum Ada Penjualan"
        emptyDescription="Tidak ada transaksi yang sesuai dengan filter laporan."
      />
    </section>
  );
}
