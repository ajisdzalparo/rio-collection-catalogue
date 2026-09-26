'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ReceiptText } from 'lucide-react';
import { DataTable, type Column } from '@/components/shared/data-table/data-table';
import { OrderStatusBadge } from '@/components/shared/order-status-badge';
import { formatIDR } from '@/lib/utils';
import type { Order } from '@/hooks/use-orders';
import { allocateAmountByWeights } from '@/lib/referral';
import { Badge } from '@/components/ui/badge';

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
        const itemGross = order.items.map((it) => it.price * it.quantity);
        const itemDiscounts = allocateAmountByWeights(itemGross, order.discountAmount ?? 0);
        const itemRevenues = itemGross.map((g, idx) => g - itemDiscounts[idx]);
        const itemRewards = allocateAmountByWeights(itemGross, order.referralRewardAmount ?? 0);

        return order.items
          .map((item, index) => ({ item, index }))
          .filter(
            ({ item }) => selectedProducts.length === 0 || selectedProducts.includes(item.name)
          )
          .map(({ item, index }) => {
            const grossItem = itemGross[index];
            const discount = itemDiscounts[index];
            const sales = itemRevenues[index];
            const cogs = (item.cogs ?? 0) * item.quantity;
            const grossProfit = sales - cogs;
            const referralReward = itemRewards[index];
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
        className: 'min-w-[115px]',
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
        className: 'min-w-[140px]',
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
      { header: 'Pelanggan', accessorKey: 'customer', className: 'min-w-[140px]', sortable: true },
      { header: 'Produk', accessorKey: 'product', className: 'min-w-[200px]', sortable: true },
      { header: 'Ukuran', accessorKey: 'size', className: 'min-w-[75px] text-center' },
      {
        header: 'Qty',
        accessorKey: 'quantity',
        className: 'min-w-[65px] text-right',
        sortable: true
      },
      {
        header: 'Harga Kotor',
        accessorKey: 'grossSales',
        className: 'min-w-[120px] text-right',
        sortable: true,
        cell: (row) => formatIDR(row.grossSales)
      },
      {
        header: 'Diskon',
        accessorKey: 'discount',
        className: 'min-w-[115px] text-right',
        sortable: true,
        cell: (row) =>
          row.discount > 0 ? (
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              -{formatIDR(row.discount)}
            </span>
          ) : null
      },
      {
        header: 'Kode Referral',
        accessorKey: 'referralCode',
        className: 'min-w-[120px]',
        cell: (row) =>
          row.referralCode ? (
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Badge variant="secondary" className="text-[10px] font-mono font-semibold">
                {row.referralCode}
              </Badge>
              {row.referralPartner && (
                <span className="text-[10px] text-muted-foreground">
                  ({row.referralPartner})
                </span>
              )}
            </div>
          ) : null
      },
      {
        header: 'Penjualan Bersih',
        accessorKey: 'sales',
        className: 'min-w-[130px] text-right font-semibold',
        sortable: true,
        cell: (row) => formatIDR(row.sales)
      },
      {
        header: 'HPP',
        accessorKey: 'cogs',
        className: 'min-w-[110px] text-right',
        sortable: true,
        cell: (row) => formatIDR(row.cogs)
      },
      {
        header: 'Komisi Referral',
        accessorKey: 'referralReward',
        className: 'min-w-[140px] text-right',
        sortable: true,
        cell: (row) =>
          row.referralReward > 0 ? (
            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
              <span className="font-semibold">{formatIDR(row.referralReward)}</span>
              <span className="text-[9px] text-muted-foreground">
                ({row.referralPayoutId ? 'Sudah Ditransfer' : 'Belum Ditransfer'})
              </span>
            </div>
          ) : null
      },
      {
        header: 'Laba Bersih',
        accessorKey: 'netProfit',
        className: 'min-w-[120px] text-right font-bold',
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
        className: 'min-w-[130px] text-center',
        cell: (row) => <OrderStatusBadge status={row.status} />
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
        density="comfortable"
        tableClassName="min-w-[1550px]"
        striped
        emptyTitle="Belum Ada Penjualan"
        emptyDescription="Tidak ada transaksi yang sesuai dengan filter laporan."
      />
    </section>
  );
}
