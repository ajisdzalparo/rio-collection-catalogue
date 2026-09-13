'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Activity, Eye, Search, UserRound, Workflow } from 'lucide-react';
import PageHeader from '@/components/layout/page-header';
import { ErrorState } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDebounce } from '@/hooks/use-debounce';
import { ActivityLogFilterDrawer } from './activity-log-filters';
import { ActivityLogSkeleton } from './activity-log-skeleton';
import { useActivityLogs } from '../hooks/use-activity-logs';
import type { ActivityLogFilters } from '../types';

const actionStyles: Record<string, string> = {
  CREATE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  UPDATE: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  DELETE: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  PASSWORD_RESET: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  STATUS_CHANGE: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  SETTINGS_UPDATE: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  LOGIN: 'bg-slate-500/10 text-slate-600 dark:text-slate-300'
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(value));
}

export function ActivityLogPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ActivityLogFilters>({ action: 'ALL', module: 'ALL' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debouncedSearch = useDebounce(search, 350);
  const { data, isLoading, isFetching, error } = useActivityLogs({
    ...filters,
    page,
    pageSize,
    search: debouncedSearch
  });

  if (isLoading && !data) return <ActivityLogSkeleton />;
  if (error && !data) return <ErrorState message={error.message} />;

  const items = data?.items || [];
  const pagination = data?.pagination || { page: 1, pageSize, total: 0, totalPages: 1 };
  const summary = data?.summary || { total: 0, today: 0, uniqueActors: 0 };
  const cards = [
    { label: 'Total aktivitas', value: summary.total, icon: Activity },
    { label: 'Aktivitas hari ini', value: summary.today, icon: Workflow },
    { label: 'Pengguna aktif', value: summary.uniqueActors, icon: UserRound }
  ];

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Activity Log"
        description="Pantau riwayat aktivitas penting CMS dan siapa yang melakukan perubahan."
      />

      <section aria-label="Ringkasan activity log" className="grid gap-3 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label} size="sm" className="min-h-28">
            <CardContent className="flex h-full flex-col justify-between gap-3">
              <Icon className="h-4 w-4 text-primary" />
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
                <p className="mt-1 text-xl font-black tabular-nums">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="gap-0 pb-0">
        <CardHeader className="border-b border-border/30">
          <CardTitle className="text-sm font-bold">Riwayat Aktivitas</CardTitle>
          <CardDescription className="text-xs">Data terbaru ditampilkan lebih dulu.</CardDescription>
        </CardHeader>
        <div className="flex flex-col gap-3 border-b border-border/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Cari nama, email, atau aktivitas..."
              aria-label="Cari activity log"
              className="h-10 pl-9"
            />
          </div>
          <ActivityLogFilterDrawer
            filters={filters}
            onApply={(nextFilters) => {
              setFilters(nextFilters);
              setPage(1);
            }}
          />
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto px-4 py-3">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Pelaku</TableHead>
                  <TableHead>Aktivitas</TableHead>
                  <TableHead>Modul</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="w-16 text-right">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className={isFetching ? 'opacity-60' : undefined}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatTimestamp(item.createdAt)}
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-bold">{item.actorName}</p>
                      <p className="text-[11px] text-muted-foreground">{item.actorEmail}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={actionStyles[item.action]}>
                        {item.action.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-semibold">{item.module}</TableCell>
                    <TableCell className="max-w-md text-xs">{item.description}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/dashboard/activity-logs/${item.id}`}
                        aria-label={`Lihat detail ${item.description}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-14 text-center text-sm text-muted-foreground">
                      Belum ada aktivitas yang cocok dengan filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <div className="border-t border-border/30 px-4 py-2">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalEntries={pagination.total}
            pageSize={pagination.pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            disabled={isFetching}
          />
        </div>
      </Card>

    </div>
  );
}
