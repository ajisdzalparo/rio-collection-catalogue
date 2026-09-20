import React, { useMemo } from 'react';
import Link from 'next/link';
import { ReceiptText } from 'lucide-react';
import { DataTable, type Column } from '@/components/shared/data-table/data-table';
import { OrderStatusBadge } from '@/components/shared/order-status-badge';
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
  sales: number;
  cogs: number;
  grossProfit: number;
  status: Order['status'];
}

export function ReportsSalesTable({
  currentOrders,
  selectedProducts
}: ReportsSalesTableProps) {
  const rows = useMemo<ReportTableRow[]>(
    () =>
      currentOrders.flatMap((order) => {
        const revenues = netItemRevenues(order.items, order.discountAmount ?? 0);
        return order.items
          .map((item, index) => ({ item, index }))
          .filter(
            ({ item }) => selectedProducts.length === 0 || selectedProducts.includes(item.name)
          )
          .map(({ item, index }) => {
            const sales = revenues[index];
            const cogs = (item.cogs ?? 180000) * item.quantity;
            return {
              id: `${order.id}-${index}`,
              orderId: order.id,
              createdAt: order.createdAt,
              orderNumber: order.orderNumber,
              customer: order.fullName,
              product: item.name,
              size: item.size,
              quantity: item.quantity,
              sales,
              cogs,
              grossProfit: sales - cogs,
              status: order.status
            };
          })
      }),
    [currentOrders, selectedProducts]
  );

  const columns = useMemo<Column<ReportTableRow>[]>(
    () => [
      {
        header: 'Tanggal',
        accessorKey: 'createdAt',
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
        cell: (row) => (
          <Link
            href={`/dashboard/orders/${row.orderId}`}
            className="font-mono text-xs font-bold text-primary hover:underline"
          >
            {row.orderNumber}
          </Link>
        )
      },
      { header: 'Pelanggan', accessorKey: 'customer' },
      { header: 'Produk', accessorKey: 'product' },
      { header: 'Ukuran', accessorKey: 'size', className: 'text-center' },
      { header: 'Qty', accessorKey: 'quantity', className: 'text-right' },
      {
        header: 'Penjualan',
        accessorKey: 'sales',
        className: 'text-right',
        cell: (row) => formatIDR(row.sales)
      },
      {
        header: 'HPP',
        accessorKey: 'cogs',
        className: 'text-right',
        cell: (row) => formatIDR(row.cogs)
      },
      {
        header: 'Laba Kotor',
        accessorKey: 'grossProfit',
        className: 'text-right font-bold',
        cell: (row) => formatIDR(row.grossProfit)
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: (row) => <OrderStatusBadge status={row.status} className="px-2.5 py-0.5 text-[9px]" />
      }
    ],
    []
  );

  return (
    <section className="space-y-4 rounded-xl border border-border/40 bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-border/20 pb-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <ReceiptText className="h-4 w-4 text-primary" />
          Tabel Laporan Penjualan
        </h2>
        <span className="text-xs font-semibold text-muted-foreground">{rows.length} baris</span>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        searchKey="orderNumber"
        extraSearchKeys={['customer', 'product']}
        searchPlaceholder="Cari pesanan, pelanggan, atau produk..."
        searchParamKey="reportSearch"
        pageSize={10}
        pageSizeOptions={[10, 20, 50]}
        density="compact"
        striped
        emptyTitle="Belum Ada Penjualan"
        emptyDescription="Tidak ada transaksi yang sesuai dengan filter laporan."
      />
    </section>
  );
}
