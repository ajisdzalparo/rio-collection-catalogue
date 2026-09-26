'use client';

import { useState } from 'react';
import { Users, ShoppingBag, Package, TrendingUp } from 'lucide-react';
import { formatIDR } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useReferralDashboardPage } from '../hooks/use-referrals';
import { useDebounce } from '@/hooks/use-debounce';
import { ReferralCreateModal } from './referral-create-modal';
import { ReferralDashboardSkeleton } from './referral-dashboard-skeleton';
import { ReferralPartnerTable } from './referral-partner-table';

interface ReferralDashboardProps {
  canManage: boolean;
  canSettle?: boolean;
}

export function ReferralDashboard({ canManage }: ReferralDashboardProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data, isLoading, error } = useReferralDashboardPage({
    search: debouncedSearch.trim() || undefined,
    page,
    pageSize
  });
  const partners = data?.partners ?? [];
  const options = data?.options ?? [];
  const summary = data?.summary ?? {
    totalPartners: 0,
    totalPaidOrders: 0,
    totalUnitsSold: 0,
    totalNetRevenue: 0
  };
  const meta = data?.meta ?? { page: 1, pageSize, total: 0, totalPages: 1 };
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (isLoading) return <ReferralDashboardSkeleton canManage={canManage} />;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Referral & Partner</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data partner, kode referral, pantau performa penjualan, dan catat pembayaran
            komisi.
          </p>
        </div>

        {canManage && (
          <Button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="font-semibold shadow-xs"
          >
            <span>+ Tambah Partner / Kode</span>
          </Button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <strong>Terjadi Kesalahan:</strong> {error.message}
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card size="sm" className="border-border/70 bg-card/60 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Total Partner</p>
              <Users className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
              {summary.totalPartners}
            </p>
          </CardContent>
        </Card>

        <Card size="sm" className="border-border/70 bg-card/60 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Order Lunas</p>
              <ShoppingBag className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
              {summary.totalPaidOrders}
            </p>
          </CardContent>
        </Card>

        <Card size="sm" className="border-border/70 bg-card/60 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Unit Terjual</p>
              <Package className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
              {summary.totalUnitsSold}{' '}
              <span className="text-xs font-normal text-muted-foreground">pcs</span>
            </p>
          </CardContent>
        </Card>

        <Card size="sm" className="border-border/70 bg-card/60 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Penjualan Neto</p>
              <TrendingUp className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <p className="mt-2 text-2xl font-extrabold tracking-tight">
              {formatIDR(summary.totalNetRevenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Creation Modal */}
      {canManage && (
        <ReferralCreateModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          partners={options}
        />
      )}

      {/* Main Table Section */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">Performa Partner</h2>
          <p className="text-xs text-muted-foreground">
            Daftar lengkap partner referral beserta ringkasan metrik penjualan dan status reward.
          </p>
        </div>

        <ReferralPartnerTable
          data={partners}
          isLoading={isLoading}
          canManage={canManage}
          page={meta.page}
          totalEntries={meta.total}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}
