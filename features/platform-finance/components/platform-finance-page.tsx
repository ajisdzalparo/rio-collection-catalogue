'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Download,
  LockKeyhole,
  ReceiptText,
  Search,
  ShieldCheck,
  WalletCards
} from 'lucide-react';
import { toast } from 'sonner';
import { endOfMonth, format as formatDateFns, startOfMonth } from 'date-fns';
import PageHeader from '@/components/layout/page-header';
import { ErrorState } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Grid, VStack } from '@/components/ui/layout';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { formatIDR } from '@/lib/utils';
import type { DateRange } from '@/types/date-picker.types';
import { isSuperAdminRole } from '@/lib/auth/roles';
import { useAuth } from '@/hooks/use-auth';
import { useDebounce } from '@/hooks/use-debounce';
import { usePlatformFinance } from '../hooks/use-platform-finance';
import type { PlatformFinanceTransaction } from '../types';
import { PlatformFinanceFilters, type FinanceStatusFilter } from './platform-finance-filters';
import { PlatformFinanceSettingsForm } from './platform-finance-settings';
import { PlatformFinanceSkeleton } from './platform-finance-skeleton';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value));
}

function csvValue(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function exportTransactions(transactions: PlatformFinanceTransaction[]) {
  const headers = ['Nomor Order', 'Tanggal', 'Pelanggan', 'Subtotal Produk', 'Rate Komisi', 'Nominal Komisi', 'Status'];
  const rows = transactions.map((transaction) => [
    transaction.orderNumber,
    formatDate(transaction.createdAt),
    transaction.customerName,
    transaction.baseAmount,
    transaction.commissionMode === 'PERCENTAGE'
      ? `${transaction.commissionValue}%`
      : formatIDR(transaction.commissionValue),
    transaction.commissionAmount,
    transaction.status
  ]);
  const csv = '\uFEFF' + [headers, ...rows].map((row) => row.map(csvValue).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `finance-komisi-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function PlatformFinancePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  }));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FinanceStatusFilter>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const canViewFinance = isSuperAdminRole(user?.role);
  const period = useMemo(
    () => ({
      startDate: formatDateFns(dateRange.from || new Date(), 'yyyy-MM-dd'),
      endDate: formatDateFns(dateRange.to || dateRange.from || new Date(), 'yyyy-MM-dd')
    }),
    [dateRange]
  );
  const { data, isLoading, error, updateSettings, isUpdatingSettings } = usePlatformFinance(
    period,
    canViewFinance
  );

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = debouncedSearchQuery.trim().toLowerCase();
    return (data?.transactions || []).filter((transaction) => {
      const matchesStatus = statusFilter === 'ALL' || transaction.status === statusFilter;
      const matchesSearch = !normalizedSearch ||
        transaction.orderNumber.toLowerCase().includes(normalizedSearch) ||
        transaction.customerName.toLowerCase().includes(normalizedSearch);
      return matchesStatus && matchesSearch;
    });
  }, [data?.transactions, debouncedSearchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredTransactions.slice(startIndex, startIndex + pageSize);
  }, [filteredTransactions, pageSize, safeCurrentPage]);

  const resetFilters = () => {
    setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  if (isAuthLoading) {
    return <PlatformFinanceSkeleton />;
  }

  if (!canViewFinance) {
    return (
      <Card className="mx-auto max-w-xl border-destructive/20 bg-destructive/5 p-8 text-center">
        <LockKeyhole className="mx-auto h-8 w-8 text-destructive" />
        <h1 className="mt-3 text-xl font-bold text-foreground">Akses Ditolak</h1>
        <p className="mt-2 text-sm text-muted-foreground">Halaman finance platform hanya tersedia untuk Super Admin.</p>
      </Card>
    );
  }

  const handleSave = async (payload: Parameters<typeof updateSettings>[0]) => {
    try {
      await updateSettings(payload);
      toast.success('Pengaturan finance platform berhasil disimpan.');
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : 'Gagal menyimpan pengaturan finance.');
      throw saveError;
    }
  };

  if (error) {
    return <ErrorState message={error.message || 'Finance platform tidak tersedia.'} />;
  }

  if (isLoading || !data) {
    return <PlatformFinanceSkeleton />;
  }

  const cards = [
    { label: 'Transaksi aktif', value: String(data.summary.transactionCount), icon: Activity },
    { label: 'Total komisi periode', value: formatIDR(data.summary.commissionTotal), icon: ShieldCheck },
    { label: 'Rata-rata komisi', value: formatIDR(data.summary.averageCommission), icon: WalletCards }
  ];

  return (
    <VStack gap="lg" className="pb-10">
      <PageHeader
        title="Super Admin Finance"
        description="Pantau komisi penjualan dan rincian transaksi secara terpisah dari laporan Owner."
      >
        <Button variant="outline" onClick={() => exportTransactions(filteredTransactions)} disabled={!filteredTransactions.length} className="gap-2 rounded-xl">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </PageHeader>

      <section aria-labelledby="finance-summary-heading" className="space-y-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="finance-summary-heading" className="text-sm font-bold uppercase tracking-wider text-foreground">Ringkasan Periode</h2>
          <span className="text-xs text-muted-foreground">{filteredTransactions.length} dari {data.summary.transactionCount} transaksi aktif</span>
        </div>
        <Grid cols={3} gap="sm">
          {cards.map(({ label, value, icon: Icon }) => (
            <Card key={label} size="sm" className="min-h-28 justify-between">
              <CardContent className="flex h-full flex-col justify-between gap-3">
                <Icon className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
                  <p className="mt-1 text-lg font-black tabular-nums text-foreground">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </Grid>
      </section>

      <Card aria-labelledby="finance-settings-heading">
        <CardHeader className="flex grid-cols-[auto_1fr] items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary"><ReceiptText className="h-4 w-4" /></div>
          <div>
            <CardTitle id="finance-settings-heading" className="text-sm font-bold">Pengaturan Platform</CardTitle>
            <CardDescription className="mt-1 text-xs">Rate baru berlaku untuk transaksi yang baru masuk status PAID. Snapshot transaksi lama tidak berubah.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
        <PlatformFinanceSettingsForm
          key={data.settings.updatedAt}
          settings={data.settings}
          onSave={handleSave}
          isSaving={isUpdatingSettings}
        />
        </CardContent>
      </Card>

      <Card aria-labelledby="commission-table-heading" className="gap-0 pb-0">
        <CardHeader className="border-b border-border/30">
          <CardTitle id="commission-table-heading" className="text-sm font-bold">Komisi Per Transaksi</CardTitle>
          <CardDescription className="mt-1 text-xs">Basis komisi adalah subtotal produk, tidak termasuk ongkir.</CardDescription>
        </CardHeader>
        <div className="flex flex-col gap-3 border-b border-border/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
              aria-label="Cari transaksi berdasarkan nomor order atau pelanggan"
              placeholder="Cari nomor order atau nama pelanggan..."
              className="h-10 pl-9"
            />
          </div>

          <PlatformFinanceFilters
            dateRange={dateRange}
            statusFilter={statusFilter}
            onApply={(filters) => {
              setDateRange(filters.dateRange);
              setStatusFilter(filters.statusFilter);
              setCurrentPage(1);
            }}
            onReset={resetFilters}
          />
        </div>
        <CardContent className="p-0">
          <div className="px-4 py-3">
            <Table className="min-w-[900px] table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[16%]">Order</TableHead>
                  <TableHead className="w-[12%]">Tanggal</TableHead>
                  <TableHead className="w-[18%]">Pelanggan</TableHead>
                  <TableHead className="w-[14%] text-right">Subtotal</TableHead>
                  <TableHead className="w-[10%] text-right">Mode</TableHead>
                  <TableHead className="w-[10%] text-right">Nilai</TableHead>
                  <TableHead className="w-[12%] text-right">Komisi</TableHead>
                  <TableHead className="w-[8%] whitespace-nowrap text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/orders/${transaction.id}`}
                        className="font-mono text-xs font-bold text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        {transaction.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(transaction.createdAt)}</TableCell>
                    <TableCell>{transaction.customerName}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatIDR(transaction.baseAmount)}</TableCell>
                    <TableCell className="text-right text-[11px] font-semibold text-muted-foreground">
                      {transaction.commissionMode === 'PERCENTAGE' ? 'Persentase' : 'Nominal'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {transaction.commissionMode === 'PERCENTAGE'
                        ? `${transaction.commissionValue}%`
                        : formatIDR(transaction.commissionValue)}
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatIDR(transaction.commissionAmount)}</TableCell>
                    <TableCell className="text-right"><Badge variant="secondary" className="bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400">{transaction.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredTransactions.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Tidak ada transaksi yang cocok dengan filter saat ini.</p>}
          </div>
        </CardContent>
        {filteredTransactions.length > 0 && (
          <div className="border-t border-border/30 px-4 py-2">
            <Pagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              totalEntries={filteredTransactions.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newPageSize) => {
                setPageSize(newPageSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </div>
        )}
      </Card>
    </VStack>
  );
}
