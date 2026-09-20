'use client';

import { useMemo, useState } from 'react';
import { Users, ShoppingBag, Package, TrendingUp, PlusCircle } from 'lucide-react';
import { formatIDR } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useReferralDashboard } from '../hooks/use-referrals';
import { ReferralCreateForms } from './referral-create-forms';
import { ReferralDashboardSkeleton } from './referral-dashboard-skeleton';
import { ReferralPartnerTable } from './referral-partner-table';

interface ReferralDashboardProps {
  canManage: boolean;
  canSettle: boolean;
}

export function ReferralDashboard({ canManage }: ReferralDashboardProps) {
  const { data: partners = [], isLoading, error } = useReferralDashboard();
  const [showCreateForms, setShowCreateForms] = useState(false);

  const totalPaidOrders = useMemo(
    () => partners.reduce((sum, partner) => sum + partner.paidOrders, 0),
    [partners]
  );
  const totalUnitsSold = useMemo(
    () => partners.reduce((sum, partner) => sum + partner.unitsSold, 0),
    [partners]
  );
  const totalNetRevenue = useMemo(
    () => partners.reduce((sum, partner) => sum + partner.netRevenue, 0),
    [partners]
  );

  if (isLoading) return <ReferralDashboardSkeleton canManage={canManage} />;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Referral & Partner</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data partner, kode referral, pantau performa penjualan, dan catat pembayaran komisi.
          </p>
        </div>

        {canManage && (
          <Button
            type="button"
            onClick={() => setShowCreateForms((prev) => !prev)}
            variant={showCreateForms ? 'secondary' : 'default'}
            className="gap-2 font-semibold shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{showCreateForms ? 'Tutup Form Partner' : 'Tambah Partner / Kode'}</span>
          </Button>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
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
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">{partners.length}</p>
          </CardContent>
        </Card>

        <Card size="sm" className="border-border/70 bg-card/60 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Order Lunas</p>
              <ShoppingBag className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">{totalPaidOrders}</p>
          </CardContent>
        </Card>

        <Card size="sm" className="border-border/70 bg-card/60 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Unit Terjual</p>
              <Package className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
              {totalUnitsSold} <span className="text-xs font-normal text-muted-foreground">pcs</span>
            </p>
          </CardContent>
        </Card>

        <Card size="sm" className="border-border/70 bg-card/60 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Penjualan Neto</p>
              <TrendingUp className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatIDR(totalNetRevenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Collapsible / Toggleable Creation Forms */}
      {canManage && showCreateForms && (
        <div className="animate-in fade-in-0 duration-300">
          <ReferralCreateForms partners={partners} />
        </div>
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
        />
      </div>
    </div>
  );
}
