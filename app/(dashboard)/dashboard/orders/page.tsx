'use client';

import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  XCircle,
  MoreHorizontal,
  Clock,
  RefreshCw,
  AlertTriangle,
  Eye,
  SlidersHorizontal,
  RotateCcw,
  Trash2,
  BellRing,
  Printer
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/social-icons';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { MultiSelect } from '@/components/ui/multi-select';
import { useOrders, type Order } from '@/hooks/use-orders';
import { DataTable, type Column } from '@/components/shared/data-table/data-table';
import { CmsPageSkeleton } from '@/components/shared/cms-page-skeleton';
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
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useStoreSettingsQuery, useStoreSettingsStore } from '@/hooks/use-store-settings';
import { useStoreBanksQuery } from '@/hooks/use-store-banks';
import { buildWhatsAppMessage, formatStoreBankDetails } from '@/lib/order-whatsapp';
import { ORDER_STATUS_OPTIONS } from '@/lib/order-status';
import { OrderInvoiceDialog } from '@/components/dashboard/order-invoice-dialog';

function OrdersPageContent() {
  const router = useRouter();
  const persistedStoreSettings = useStoreSettingsStore();
  const { data: latestStoreSettings } = useStoreSettingsQuery();
  const { data: storeBanks = [] } = useStoreBanksQuery();
  const storeSettings = latestStoreSettings || persistedStoreSettings;
  const {
    data: orders = [],
    isLoading: loading,
    updateOrder,
    isUpdating,
    cleanupStaleOrders,
    isCleaningUp,
    deleteExpiredOrders,
    isDeletingExpired
  } = useOrders();

  const [appliedStatuses, setAppliedStatuses] = useState<string[]>([]);
  const [draftStatuses, setDraftStatuses] = useState<string[]>([]);
  const [appliedStartDate, setAppliedStartDate] = useState<Date | undefined>();
  const [appliedEndDate, setAppliedEndDate] = useState<Date | undefined>();
  const [draftStartDate, setDraftStartDate] = useState<Date | undefined>();
  const [draftEndDate, setDraftEndDate] = useState<Date | undefined>();
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [isDeleteExpiredOpen, setIsDeleteExpiredOpen] = useState(false);

  const [cancelTargetOrder, setCancelTargetOrder] = useState<Order | null>(null);
  const [invoiceTargetOrder, setInvoiceTargetOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const handleOpenFilterDrawer = (open: boolean) => {
    if (open) {
      setDraftStatuses(appliedStatuses);
      setDraftStartDate(appliedStartDate);
      setDraftEndDate(appliedEndDate);
    }
    setIsFilterOpen(open);
  };

  const handleApplyFilters = () => {
    if (draftStartDate && draftEndDate && draftStartDate > draftEndDate) {
      toast.error('Start Date tidak boleh melewati End Date.');
      return;
    }
    setAppliedStatuses(draftStatuses);
    setAppliedStartDate(draftStartDate);
    setAppliedEndDate(draftEndDate);
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    setDraftStatuses([]);
    setAppliedStatuses([]);
    setDraftStartDate(undefined);
    setDraftEndDate(undefined);
    setAppliedStartDate(undefined);
    setAppliedEndDate(undefined);
    setIsFilterOpen(false);
  };

  const activeFilterCount = appliedStatuses.length + (appliedStartDate || appliedEndDate ? 1 : 0);

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

  const expiredOrderCount = orders.filter((order) => order.status === 'EXPIRED').length;

  const handleDeleteExpiredOrders = async () => {
    try {
      const deletedCount = await deleteExpiredOrders();
      toast.success(`${deletedCount} order kedaluwarsa berhasil dihapus.`);
      setIsDeleteExpiredOpen(false);
    } catch (err: unknown) {
      toast.error('Gagal menghapus order kedaluwarsa', {
        description: err instanceof Error ? err.message : undefined
      });
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    return <OrderStatusBadge status={status} />;
  };

  const getReminderWaLink = useCallback(
    (order: Order) => {
      const bankDetails = formatStoreBankDetails(storeBanks, storeSettings);
      const message = buildWhatsAppMessage({
        stage: 'REMINDER',
        templates: storeSettings,
        customerName: order.fullName,
        orderNumber: order.orderNumber,
        totalPayment: order.totalPrice,
        bankDetails
      });

      return `https://wa.me/${formatWaNumber(order.whatsapp)}?text=${encodeURIComponent(message)}`;
    },
    [storeSettings, storeBanks]
  );

  const filteredOrders = useMemo(() => {
    const startBoundary = appliedStartDate ? new Date(appliedStartDate) : undefined;
    const endBoundary = appliedEndDate ? new Date(appliedEndDate) : undefined;
    startBoundary?.setHours(0, 0, 0, 0);
    endBoundary?.setHours(23, 59, 59, 999);

    return orders.filter((order) => {
      if (appliedStatuses.length > 0 && !appliedStatuses.includes(order.status)) return false;
      const createdAt = new Date(order.createdAt);
      if (startBoundary && createdAt < startBoundary) return false;
      if (endBoundary && createdAt > endBoundary) return false;
      return true;
    });
  }, [orders, appliedStatuses, appliedStartDate, appliedEndDate]);

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
          <TruncatedText
            text={order.fullName}
            maxWidth="max-w-[180px]"
            className="font-semibold text-foreground text-xs"
          />
        )
      },
      {
        header: 'Total',
        accessorKey: 'totalPrice',
        sortable: true,
        className: 'font-bold text-xs',
        cell: (order) => (
          <span className="font-extrabold text-foreground">{formatIDR(order.totalPrice)}</span>
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
                    variant="link"
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
                  <span>Lihat &amp; Proses Pesanan</span>
                </DropdownMenuItem>

                {order.status === 'FULFILLED' && (
                  <DropdownMenuItem
                    onClick={() => setInvoiceTargetOrder(order)}
                    className="gap-2 cursor-pointer font-medium"
                  >
                    <Printer className="h-3.5 w-3.5 text-primary" />
                    <span>Cetak Invoice</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={() => {
                    window.open(`https://wa.me/${formatWaNumber(order.whatsapp)}`, '_blank');
                  }}
                  className="gap-2 cursor-pointer font-medium"
                >
                  <WhatsAppIcon size={14} className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Chat WA Pelanggan</span>
                </DropdownMenuItem>

                {order.status === 'WAITING_PAYMENT' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        window.open(getReminderWaLink(order), '_blank', 'noopener,noreferrer');
                      }}
                      className="gap-2 cursor-pointer font-medium text-emerald-600 dark:text-emerald-400"
                    >
                      <BellRing className="h-3.5 w-3.5" />
                      <span>Kirim Reminder Tagihan</span>
                    </DropdownMenuItem>
                  </>
                )}

                {order.status === 'PENDING' && (
                  <>
                    <DropdownMenuSeparator />
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
    [getReminderWaLink, isUpdating, router]
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
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunCronCleanup}
            disabled={isCleaningUp}
            className="h-9 px-3.5 rounded-xl text-xs font-bold gap-1.5 cursor-pointer border-border/30 hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isCleaningUp ? 'animate-spin' : ''}`} />
            <span>{isCleaningUp ? 'Memproses Cron...' : 'Perbarui Status Expired'}</span>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteExpiredOpen(true)}
            disabled={expiredOrderCount === 0 || isDeletingExpired}
            className="h-9 gap-1.5 rounded-xl px-3.5 text-xs font-bold"
          >
            <Trash2 className="h-3.5 w-3.5 text-white" />
            <span>Hapus Pesanan Spam ({expiredOrderCount})</span>
          </Button>
        </div>
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
                  className="h-10 sm:h-9 px-3.5 gap-2 rounded-lg text-xs font-medium cursor-pointer border-border/60 bg-card/60 shadow-2xs hover:bg-muted"
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
                  Saring data pesanan berdasarkan status dan periode transaksi.
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

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">Start Date</Label>
                    <DatePicker
                      mode="single"
                      value={draftStartDate}
                      onChange={setDraftStartDate}
                      maxDate={draftEndDate}
                      placeholder="Pilih tanggal mulai"
                      format="dd MMM yyyy"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">End Date</Label>
                    <DatePicker
                      mode="single"
                      value={draftEndDate}
                      onChange={setDraftEndDate}
                      minDate={draftStartDate}
                      placeholder="Pilih tanggal akhir"
                      format="dd MMM yyyy"
                      className="w-full"
                    />
                  </div>
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

      <ConfirmDialog
        open={isDeleteExpiredOpen}
        onOpenChange={setIsDeleteExpiredOpen}
        title="Hapus Semua Order Kedaluwarsa"
        description={`${expiredOrderCount} order berstatus kedaluwarsa akan dihapus permanen beserta itemnya. Order aktif, lunas, dan sudah dikirim tidak akan terhapus.`}
        confirmText={`Hapus ${expiredOrderCount} Order`}
        cancelText="Batal"
        isLoading={isDeletingExpired}
        onConfirm={() => void handleDeleteExpiredOrders()}
      />

      {/* Invoice & Bluetooth Thermal Print Dialog */}
      {invoiceTargetOrder && (
        <OrderInvoiceDialog
          order={invoiceTargetOrder}
          open={Boolean(invoiceTargetOrder)}
          onOpenChange={(open) => {
            if (!open) setInvoiceTargetOrder(null);
          }}
        />
      )}
    </VStack>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<CmsPageSkeleton variant="list" />}>
      <OrdersPageContent />
    </Suspense>
  );
}
