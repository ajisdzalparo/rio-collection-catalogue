'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  ShoppingBag,
  TrendingUp,
  Package,
  CreditCard,
  QrCode,
  Calendar,
  MessageSquare,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { formatIDR, formatWaNumber } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/icons/social-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { useProducts } from '@/hooks/use-products';
import { useReferralPartner, useReferralActions } from '../hooks/use-referrals';
import { ReferralCodeCard } from './referral-code-card';
import { ReferralPayoutSection } from './referral-payout-section';

interface ReferralPartnerDetailPageProps {
  partnerId: string;
  canManage: boolean;
  canSettle: boolean;
}

export function ReferralPartnerDetailPage({
  partnerId,
  canManage,
  canSettle
}: ReferralPartnerDetailPageProps) {
  const router = useRouter();
  const actions = useReferralActions();
  const { partner, isLoading, isError, error } = useReferralPartner(partnerId);
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-label="Memuat detail partner">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-60" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !partner) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/referrals">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Referral & Partner</span>
          </Button>
        </Link>
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center text-sm text-destructive">
          <strong>Partner Tidak Ditemukan:</strong>{' '}
          {error?.message || 'Data partner tidak ada atau telah dihapus.'}
        </div>
      </div>
    );
  }

  const isUnused =
    partner.paidOrders === 0 && partner.unitsSold === 0 && partner.payouts.length === 0;

  async function handleDeletePartner() {
    if (!partner) return;
    setIsDeleting(true);
    try {
      await actions.deletePartner(partner.id);
      toast.success(`Partner "${partner.name}" berhasil dihapus.`);
      setShowDeleteModal(false);
      router.push('/dashboard/referrals');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus partner.');
    } finally {
      setIsDeleting(false);
    }
  }

  const initials = partner.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const totalPendingCash = partner.codes
    .filter((c) => c.rewardKind === 'CASH')
    .reduce((sum, c) => sum + c.payableCash, 0);

  const totalAvailableGifts = partner.codes
    .filter((c) => c.rewardKind === 'SHIRT')
    .reduce((sum, c) => sum + c.availableGifts, 0);

  const allOrders = partner.codes.flatMap((c) =>
    c.orders.map((o) => ({
      ...o,
      referralCode: c.code,
      rewardKind: c.rewardKind
    }))
  );

  return (
    <>
      <div className="space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/referrals">
              <Button variant="outline" size="icon-sm" className="rounded-xl" aria-label="Kembali">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {partner.name}
                </h1>
                <Badge variant="outline" className="text-xs">
                  Partner
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Detail profil, kode referral, dan riwayat komisi partner.
              </p>
            </div>
          </div>

          {canManage && isUnused && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              className="gap-1.5 text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Hapus Partner</span>
            </Button>
          )}
        </div>

        {/* Main Partner Profile Card */}
        <Card className="overflow-hidden border-border/80 shadow-xs">
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-extrabold text-lg shadow-md shadow-primary/20">
                  {initials}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-foreground">{partner.name}</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {partner.whatsapp ? (
                      <a
                        href={`https://wa.me/${partner.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        <WhatsAppIcon
                          size={14}
                          className="text-emerald-600 dark:text-emerald-400"
                        />
                        <span>{formatWaNumber(partner.whatsapp)}</span>
                      </a>
                    ) : (
                      <span>WhatsApp belum dicatat</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Bergabung:{' '}
                      {new Date(partner.createdAt).toLocaleDateString('id-ID', {
                        dateStyle: 'long'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-2.5 py-1 text-xs font-semibold">
                  {partner.codes.length} Kode Terdaftar
                </Badge>
              </div>
            </div>

            {partner.notes && (
              <div className="flex items-start gap-2.5 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground border border-border/50">
                <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <span>{partner.notes}</span>
              </div>
            )}

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Order Lunas</span>
                </div>
                <p className="mt-1 text-xl font-extrabold text-foreground">{partner.paidOrders}</p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>Customer Unik</span>
                </div>
                <p className="mt-1 text-xl font-extrabold text-foreground">
                  {partner.customerCount}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Package className="h-3.5 w-3.5" />
                  <span>Unit Terjual</span>
                </div>
                <p className="mt-1 text-xl font-extrabold text-foreground">
                  {partner.unitsSold}{' '}
                  <span className="text-xs font-normal text-muted-foreground">pcs</span>
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Penjualan Neto</span>
                </div>
                <p className="mt-1 text-xl font-extrabold text-foreground">
                  {formatIDR(partner.netRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Breakdown */}
        <Tabs defaultValue="codes" className="w-full">
          <TabsList
            variant="pills"
            className="w-full flex items-center justify-start gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar scrollbar-none p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-muted/40 border border-border/50"
          >
            <TabsTrigger
              value="codes"
              variant="pills"
              className="shrink-0 whitespace-nowrap gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg sm:rounded-xl transition-all"
            >
              <QrCode className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden sm:inline">Kode Referral & Reward</span>
              <span className="sm:hidden">Kode & Reward</span>
              <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-muted/80 px-1.5 py-0.2 text-[10px] font-bold text-muted-foreground group-data-selected:bg-primary-foreground/20 group-data-selected:text-primary-foreground group-aria-selected:bg-primary-foreground/20 group-aria-selected:text-primary-foreground transition-colors">
                {partner.codes.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="payouts"
              variant="pills"
              className="shrink-0 whitespace-nowrap gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg sm:rounded-xl transition-all"
            >
              <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden sm:inline">Pembayaran Reward (Tunai)</span>
              <span className="sm:hidden">Reward Tunai</span>
              {totalPendingCash > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-rose-500/15 px-1.5 py-0.2 text-[10px] font-bold text-rose-600 dark:text-rose-400 group-data-selected:bg-rose-500 group-data-selected:text-white transition-colors">
                  {formatIDR(totalPendingCash)}
                </span>
              )}
              {totalAvailableGifts > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-amber-500/15 px-1.5 py-0.2 text-[10px] font-bold text-amber-600 dark:text-amber-400 group-data-selected:bg-amber-500 group-data-selected:text-white transition-colors">
                  {totalAvailableGifts} Kaos
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="orders"
              variant="pills"
              className="shrink-0 whitespace-nowrap gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg sm:rounded-xl transition-all"
            >
              <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden sm:inline">Riwayat Pesanan</span>
              <span className="sm:hidden">Riwayat Order</span>
              <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-muted/80 px-1.5 py-0.2 text-[10px] font-bold text-muted-foreground group-data-selected:bg-primary-foreground/20 group-data-selected:text-primary-foreground group-aria-selected:bg-primary-foreground/20 group-aria-selected:text-primary-foreground transition-colors">
                {allOrders.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: CODES */}
          <TabsContent value="codes" className="mt-4 space-y-4">
            {partner.codes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground">
                Partner ini belum memiliki kode referral.
              </div>
            ) : (
              partner.codes.map((code) => (
                <ReferralCodeCard
                  key={code.id}
                  code={code}
                  products={products}
                  productsLoading={productsLoading}
                  canManage={canManage}
                  canSettle={canSettle}
                />
              ))
            )}
          </TabsContent>

          {/* TAB 2: PAYOUTS */}
          <TabsContent value="payouts" className="mt-4">
            <ReferralPayoutSection partner={partner} canSettle={canSettle} />
          </TabsContent>

          {/* TAB 3: ALL ORDERS */}
          <TabsContent value="orders" className="mt-4 space-y-3">
            {allOrders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground">
                Belum ada transaksi pesanan yang menggunakan kode referral dari partner ini.
              </div>
            ) : (
              <div className="divide-y divide-border/60 rounded-xl border border-border bg-card">
                {allOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="font-mono font-bold text-primary hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                        <Badge variant="outline" className="text-[10px]">
                          {order.status}
                        </Badge>
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                          Kode: {order.referralCode}
                        </span>
                      </div>
                      <p className="text-muted-foreground">
                        Pembeli: <strong className="text-foreground">{order.fullName}</strong> ·{' '}
                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                          dateStyle: 'medium'
                        })}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-foreground">
                        {formatIDR(order.netProducts)}
                        <span className="text-[11px] font-normal text-muted-foreground">
                          {' '}
                          ({order.units} unit)
                        </span>
                      </div>
                      {order.referralRewardAmount > 0 && (
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Komisi: {formatIDR(order.referralRewardAmount)}
                          {order.referralPayoutId ? ' (Lunas)' : ' (Belum Dibayar)'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Hapus Partner Referral"
        description={`Apakah Anda yakin ingin menghapus partner "${partner.name}"? Semua kode yang belum terpakai di bawah partner ini juga akan dihapus.`}
        confirmText="Hapus Partner"
        cancelText="Batal"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleDeletePartner}
      />
    </>
  );
}
