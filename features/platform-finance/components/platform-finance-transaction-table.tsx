'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { DataTable, type Column } from '@/components/shared/data-table/data-table';
import { Badge } from '@/components/ui/badge';
import { formatIDR } from '@/lib/utils';
import type { PlatformFinanceTransaction } from '../types';
import { PlatformFinanceTransactionCard } from './platform-finance-transaction-card';

interface PlatformFinanceTransactionTableProps {
  transactions: PlatformFinanceTransaction[];
  page: number;
  totalEntries: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

function formatTransactionDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value));
}

export function PlatformFinanceTransactionTable({
  transactions,
  page,
  totalEntries,
  onPageChange,
  onPageSizeChange
}: PlatformFinanceTransactionTableProps) {
  const columns: Column<PlatformFinanceTransaction>[] = useMemo(
    () => [
      {
        header: 'Order',
        accessorKey: 'orderNumber',
        cell: (transaction) => (
          <Link
            href={`/dashboard/orders/${transaction.id}`}
            className="font-mono text-xs font-bold text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {transaction.orderNumber}
          </Link>
        )
      },
      {
        header: 'Tanggal',
        accessorKey: 'createdAt',
        cell: (transaction) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatTransactionDate(transaction.createdAt)}
          </span>
        )
      },
      { header: 'Pelanggan', accessorKey: 'customerName' },
      {
        header: 'Subtotal',
        accessorKey: 'baseAmount',
        className: 'text-right',
        cell: (transaction) => (
          <span className="tabular-nums">{formatIDR(transaction.baseAmount)}</span>
        )
      },
      {
        header: 'Mode',
        accessorKey: 'commissionMode',
        className: 'text-center',
        cell: (transaction) => (
          <span className="text-[11px] font-semibold text-muted-foreground">
            {transaction.commissionMode === 'PERCENTAGE' ? 'Persentase' : 'Nominal'}
          </span>
        )
      },
      {
        header: 'Nilai',
        accessorKey: 'commissionValue',
        className: 'text-right',
        cell: (transaction) => (
          <span className="tabular-nums text-muted-foreground">
            {transaction.commissionMode === 'PERCENTAGE'
              ? `${transaction.commissionValue}%`
              : formatIDR(transaction.commissionValue)}
          </span>
        )
      },
      {
        header: 'Komisi',
        accessorKey: 'commissionAmount',
        className: 'text-right',
        cell: (transaction) => (
          <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatIDR(transaction.commissionAmount)}
          </span>
        )
      },
      {
        header: 'Status',
        accessorKey: 'status',
        className: 'text-center',
        cell: (transaction) => (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
          >
            {transaction.status}
          </Badge>
        )
      }
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      data={transactions}
      getRowId={(transaction) => transaction.id}
      showSearch={false}
      searchParamKey={false}
      pageSize={10}
      manualPagination
      page={page}
      totalEntries={totalEntries}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      emptyTitle="Transaksi Tidak Ditemukan"
      emptyDescription="Tidak ada transaksi yang cocok dengan periode, status, atau pencarian saat ini."
      renderCard={(transaction) => (
        <PlatformFinanceTransactionCard transaction={transaction} />
      )}
    />
  );
}
