'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Activity, Eye, Search, UserRound, Workflow, X } from 'lucide-react';
import PageHeader from '@/components/layout/page-header';
import { ErrorState } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useDebounce } from '@/hooks/use-debounce';
import { ActivityLogFilterDrawer } from './activity-log-filters';
import { ActivityLogSkeleton } from './activity-log-skeleton';
import {
  ActivityLogCard,
  activityActionStyles,
  formatActivityTimestamp
} from './activity-log-card';
import { useActivityLogs } from '../hooks/use-activity-logs';
import type { ActivityLogFilters } from '../types';

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
          <CardDescription className="text-xs">
            Data terbaru ditampilkan lebih dulu.
          </CardDescription>
        </CardHeader>
        <div className="flex flex-col gap-2.5 sm:gap-3 border-b border-border/30 px-4 py-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Cari nama, email, atau aktivitas..."
              aria-label="Cari activity log"
              className="pl-9 pr-8 h-10 sm:h-9 text-xs rounded-lg border-border/60 bg-card/60 shadow-2xs focus-visible:ring-1 w-full"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
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
          <div className="space-y-3 p-3 sm:p-4 md:hidden">
            {items.map((item) => (
              <ActivityLogCard key={item.id} item={item} isFetching={isFetching} />
            ))}
            {items.length === 0 && (
              <div className="rounded-xl border border-border/70 bg-card/80 px-4 py-10 text-center text-sm text-muted-foreground">
                Belum ada aktivitas yang cocok dengan filter.
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto px-4 py-3 md:block">
            <Table className="min-w-225">
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
                      {formatActivityTimestamp(item.createdAt)}
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-bold">{item.actorName}</p>
                      <p className="text-[11px] text-muted-foreground">{item.actorEmail}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={activityActionStyles[item.action]}>
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
                    <TableCell
                      colSpan={6}
                      className="py-14 text-center text-sm text-muted-foreground"
                    >
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
