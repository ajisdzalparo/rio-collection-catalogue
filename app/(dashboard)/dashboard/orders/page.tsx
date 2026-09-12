'use client';

import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Clock,
  RefreshCw,
  AlertTriangle,
  Eye,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/social-icons';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import { useOrders, type Order } from '@/hooks/use-orders';
import { DataTable, type Column } from '@/components/shared/data-table/data-table';
import { TruncatedText } from '@/components/ui/truncated-text';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { VStack } from '@/components/ui/layout';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { formatIDR, formatWaNumber } from '@/lib/utils';
import { OrderStatusBadge } from '@/components/shared/order-status-badge';

const ORDER_STATUS_OPTIONS: MultiSelectOption[] = [
  { value: 'PENDING', label: 'Menunggu Konfirmasi' },
  { value: 'CONFIRMED', label: 'Dikonfirmasi' },
  { value: 'WAITING_PAYMENT', label: 'Menunggu Pembayaran' },
  { value: 'PAID', label: 'Sudah Dibayar' },
  { value: 'FULFILLED', label: 'Pesanan Dikirim' },
  { value: 'REJECTED', label: 'Pesanan Ditolak' },
  { value: 'CANCELLED', label: 'Pesanan Dibatalkan' },
  { value: 'EXPIRED', label: 'Kedaluwarsa' }
];

function OrdersPageContent() {
  const router = useRouter();
  const {
    data: orders = [],
    isLoading: loading,
    updateOrder,
    isUpdating,
    cleanupStaleOrders,
    isCleaningUp
  } = useOrders();

  const [appliedStatuses, setAppliedStatuses] = useState<string[]>([]);
  const [draftStatuses, setDraftStatuses] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  const [cancelTargetOrder, setCancelTargetOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const handleOpenFilterDrawer = (open: boolean) => {
    if (open) {
      setDraftStatuses(appliedStatuses);
    }
    setIsFilterOpen(open);
  };

  const handleApplyFilters = () => {
    setAppliedStatuses(draftStatuses);
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    setDraftStatuses([]);
    setAppliedStatuses([]);
    setIsFilterOpen(false);
  };

  const activeFilterCount = appliedStatuses.length;

  const handleRunCronCleanup = async () => {
    try {
      await cleanupStaleOrders();
      toast.success('Pembersihan Cron Job Berhasil! Pesanan pending > 24 jam ditandai EXPIRED.');
    } catch (err: unknown) {
      toast.error('Gagal menjalankan pembersihan Cron', {
        description:
          err instanceof Error ? err.message : 'Terjadi kesalahan saat menjalankan Cron Job'
      });
    }
  };

  const handleApproveOrder = useCallback(
    async (order: Order, e?: React.MouseEvent) => {
      e?.stopPropagation();
      try {
        await updateOrder({ id: order.id, status: 'CONFIRMED' });
        toast.success(`Pesanan #${order.orderNumber} berhasil disetujui.`);
      } catch {
        toast.error('Gagal menyetujui pesanan.');
      }
    },
    [updateOrder]
  );

  const getStatusBadge = (status: Order['status']) => {
    return <OrderStatusBadge status={status} />;
  };

  const filteredOrders = useMemo(() => {
    if (appliedStatuses.length === 0) return orders;
    return orders.filter((order) => appliedStatuses.includes(order.status));
  }, [orders, appliedStatuses]);

  const columns: Column<Order>[] = useMemo(
    () => [
      {
        header: 'ID Order',
        accessorKey: 'orderNumber',
        sortable: true,
        cell: (order) => (
          <Link
            href={`/dashboard/orders/${order.id}`}
            className="font-mono font-bold text-xs text-primary hover:underline flex items-center gap-1"
          >
            <span>#{order.orderNumber}</span>
          </Link>
        )
      },
      {
        header: 'Tanggal',
        accessorKey: 'createdAt',
        sortable: true,
        cell: (order) => (
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>
              {new Date(order.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
        )
      },
      {
        header: 'Pelanggan',
        accessorKey: 'fullName',
        sortable: true,
        cell: (order) => (
          <div className="flex flex-col text-xs max-w-45">
            <TruncatedText
              text={order.fullName}
              maxWidth="max-w-[160px]"
              className="font-semibold text-foreground"
            />
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-muted-foreground">+{order.whatsapp}</span>
              {order.waFollowedUp ? (
                <span className="text-[9px] font-extrabold text-background bg-foreground px-1 py-0 rounded border border-transparent shrink-0">
                  WA OK
                </span>
              ) : (
                <span className="text-[9px] font-semibold text-muted-foreground bg-muted/20 px-1 py-0 rounded border border-border/10 shrink-0">
                  Belum WA
                </span>
              )}
            </div>
          </div>
        )
      },
      {
        header: 'Pengiriman & Resi',
        className: 'min-w-[160px]',
        cell: (order) => (
          <div className="text-xs space-y-0.5 max-w-45">
            <div className="font-semibold text-foreground flex items-center gap-1">
              <TruncatedText text={order.courierName || 'JNE Express'} maxWidth="max-w-[150px]" />
            </div>
            <div className="text-[10px] text-muted-foreground">
              Ongkir:{' '}
              <span className="font-bold text-foreground">
                {formatIDR(order.shippingFee || 15000)}
              </span>
            </div>
            {order.trackingNumber ? (
              <div className="text-[10px] text-foreground font-mono font-bold">
                Resi:{' '}
                <TruncatedText
                  text={order.trackingNumber}
                  maxWidth="max-w-[130px]"
                  className="inline-block"
                />
              </div>
            ) : (
              <div className="text-[10px] text-muted-foreground/60 italic">Resi: Belum diinput</div>
            )}
          </div>
        )
      },
      {
        header: 'Item Pesanan',
        className: 'w-full min-w-[180px]',
        cell: (order) => (
          <div className="text-muted-foreground text-xs space-y-1 max-w-60">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-1">
                <TruncatedText
                  text={item.name}
                  maxWidth="max-w-[140px]"
                  className="text-foreground font-medium"
                />
                <span className="text-muted-foreground shrink-0">({item.size})</span>
                <span className="font-bold text-foreground shrink-0">x{item.quantity}</span>
                {item.isPreOrder && (
                  <Badge
                    variant="secondary"
                    className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-transparent text-[9px] px-1 py-0 font-bold shrink-0"
                  >
                    PO
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )
      },
      {
        header: 'Total & Profit',
        accessorKey: 'totalPrice',
        sortable: true,
        className: 'font-bold text-xs',
        cell: (order) => (
          <div className="flex flex-col text-xs">
            <span className="font-extrabold text-foreground">{formatIDR(order.totalPrice)}</span>
            <div className="flex gap-1.5 text-[10px] mt-0.5">
              <span className="text-muted-foreground/75">
                HPP: {formatIDR(order.totalCogs || 0)}
              </span>
              <span className="text-emerald-500 font-bold">
                +{formatIDR(order.estimatedProfit || 0)}
              </span>
            </div>
          </div>
        )
      },
      {
        header: 'Status',
        accessorKey: 'status',
        sortable: true,
        cell: (order) => getStatusBadge(order.status)
      },
      {
        header: 'Aksi',
        className: 'text-right min-w-[50px]',
        cell: (order) => (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={isUpdating}
                    aria-label={`Opsi untuk pesanan ${order.orderNumber}`}
                    className="h-8 w-8 rounded-md hover:bg-muted cursor-pointer"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5">
                <DropdownMenuItem
                  onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                  className="gap-2 cursor-pointer font-medium"
                >
                  <Eye className="h-3.5 w-3.5 text-primary" />
                  <span>Lihat Detail Pesanan</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    window.open(`https://wa.me/${formatWaNumber(order.whatsapp)}`, '_blank');
                  }}
                  className="gap-2 cursor-pointer font-medium"
                >
                  <WhatsAppIcon size={14} className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Chat WA Pelanggan</span>
                </DropdownMenuItem>

                {order.status === 'PENDING' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => handleApproveOrder(order, e)}
                      disabled={isUpdating}
                      className="gap-2 cursor-pointer font-medium text-emerald-600 dark:text-emerald-400"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Setujui Pesanan</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setCancelTargetOrder(order)}
                      disabled={isUpdating}
                      className="gap-2 cursor-pointer font-medium text-destructive"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Tolak Pesanan (Spam)</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      }
    ],
    [handleApproveOrder, isUpdating, router]
  );

  return (
    <VStack gap="lg" className="pb-10 w-full">
      <VStack gap="xs">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Kelola Pesanan</h1>
        <p className="text-sm text-muted-foreground pt-1">
          Review pesanan masuk, alur konfirmasi, penyesuaian resi ekspedisi, dan follow-up WhatsApp.
        </p>
      </VStack>

      {/* Auto Cleanup Info Banner */}
      <div className="p-4 bg-muted/15 border border-border/20 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-foreground shrink-0" />
          <div className="text-xs space-y-0.5">
            <span className="font-bold text-foreground block">
              Cron Job Auto-Cleanup Pesanan Spam (24 Jam Expiry)
            </span>
            <span className="text-muted-foreground text-[11px] leading-relaxed">
              Pesanan berstatus <strong>PENDING &gt; 24 jam</strong> secara otomatis ditandai{' '}
              <strong>EXPIRED</strong> untuk mencegah penumpukan data spam.
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRunCronCleanup}
          disabled={isCleaningUp}
          className="h-9 px-3.5 rounded-xl text-xs font-bold gap-1.5 cursor-pointer shrink-0 border-border/30 hover:bg-muted"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isCleaningUp ? 'animate-spin' : ''}`} />
          <span>{isCleaningUp ? 'Memproses Cron...' : 'Jalankan Cron Now'}</span>
        </Button>
      </div>

      {/* Orders DataTable */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        isLoading={loading}
        searchKey="orderNumber"
        extraSearchKeys={['fullName', 'whatsapp']}
        searchPlaceholder="Cari no. order / nama / no. HP..."
        filterComponents={
          <Sheet open={isFilterOpen} onOpenChange={handleOpenFilterDrawer}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-lg text-xs font-medium cursor-pointer"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Filter</span>
                  {activeFilterCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              }
            />
            <SheetContent side="right">
              <SheetHeader className="border-b border-border/30 pb-4 pr-8">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-sm font-bold flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>Filter Data Pesanan</span>
                  </SheetTitle>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Reset All</span>
                    </button>
                  )}
                </div>
                <SheetDescription className="text-xs text-muted-foreground mt-1">
                  Saring data pesanan pelanggan berdasarkan status transaksi.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 py-5">
                {/* Status Multi-Filter Section */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Status Pesanan</Label>
                  <MultiSelect
                    options={ORDER_STATUS_OPTIONS}
                    value={draftStatuses}
                    onChange={setDraftStatuses}
                    placeholder="Semua Status Pesanan"
                    searchPlaceholder="Cari status..."
                    emptyText="Status tidak ditemukan"
                  />
                </div>
              </div>

              <SheetFooter className="border-t border-border/30 pt-4 flex flex-row items-center justify-end gap-2.5">
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="h-8 text-xs font-medium rounded-xl cursor-pointer gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </Button>
                <Button
                  onClick={handleApplyFilters}
                  className="h-8 text-xs font-medium rounded-xl cursor-pointer"
                >
                  Terapkan Filter
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        }
        emptyTitle="Tidak Ada Pesanan"
        emptyDescription="Tidak ada data pesanan yang cocok dengan filter atau pencarian Anda."
        pageSize={10}
      />

      {/* Quick Reject Spam Dialog */}
      <Dialog
        open={cancelTargetOrder !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCancelTargetOrder(null);
            setCancelReason('');
          }
        }}
      >
        {cancelTargetOrder && (
          <DialogContent className="sm:max-w-md bg-card border-border/50 p-6 rounded-xl">
            <DialogHeader className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border border-border bg-muted text-foreground">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <DialogTitle className="text-lg font-bold tracking-tight text-foreground mt-3">
                Konfirmasi Tolak Pesanan
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
                Apakah Anda yakin ingin menolak pesanan #{cancelTargetOrder.orderNumber}? Pesanan
                akan ditandai sebagai REJECTED.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 mt-2">
              <label className="text-xs font-bold text-foreground block">
                Alasan Penolakan (Catatan Admin)
              </label>
              <Textarea
                placeholder="Masukkan alasan..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="text-xs rounded-xl min-h-20"
              />
            </div>

            <DialogFooter className="mt-4 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCancelTargetOrder(null)}
                className="h-9 rounded-xl text-xs font-semibold"
              >
                Batal
              </Button>
              <Button
                type="button"
                disabled={isUpdating}
                onClick={async () => {
                  try {
                    await updateOrder({
                      id: cancelTargetOrder.id,
                      status: 'REJECTED',
                      adminNotes: cancelReason.trim() || 'Pesanan ditolak oleh admin (Spam)'
                    });
                    toast.success(`Pesanan #${cancelTargetOrder.orderNumber} berhasil ditolak.`);
                    setCancelTargetOrder(null);
                  } catch {
                    toast.error('Gagal menolak pesanan');
                  }
                }}
                className="h-9 rounded-xl text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isUpdating ? 'Memproses...' : 'Konfirmasi Tolak'}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </VStack>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-foreground" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading orders data...</p>
        </div>
      }
    >
      <OrdersPageContent />
    </Suspense>
  );
}
