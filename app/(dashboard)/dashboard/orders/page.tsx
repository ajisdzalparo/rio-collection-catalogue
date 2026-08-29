'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  MessageSquare,
  Calendar,
  FileText,
  ExternalLink,
  Phone,
  MapPin,
  ClipboardList,
  Pencil,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useOrders, type Order } from '@/hooks/use-orders';
import { useStoreSettingsStore } from '@/hooks/use-store-settings';
import { DataTable, type Column } from '@/components/shared/data-table/data-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { VStack } from '@/components/ui/layout';
import { formatIDR } from '@/lib/utils';

function OrdersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramOrderId = searchParams.get('id');

  const {
    data: orders = [],
    isLoading: loading,
    updateOrder,
    isUpdating,
    cleanupStaleOrders,
    isCleaningUp
  } = useOrders();

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

  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form edit states
  const [editStatus, setEditStatus] = useState<Order['status']>('PENDING');
  const [adminNotes, setAdminNotes] = useState('');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Sync selected order from query param
  useEffect(() => {
    if (paramOrderId && orders.length > 0) {
      const found = orders.find((o) => o.id === paramOrderId);
      if (found) {
        const timer = setTimeout(() => {
          setSelectedOrder(found);
          setEditStatus(found.status);
          setAdminNotes(found.adminNotes || '');
          setCourierName(found.courierName || 'JNE Express (REG)');
          setTrackingNumber(found.trackingNumber || '');
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [paramOrderId, orders]);

  const handleOpenDetail = useCallback(
    (order: Order) => {
      setSelectedOrder(order);
      setEditStatus(order.status);
      setAdminNotes(order.adminNotes || '');
      setCourierName(order.courierName || 'JNE Express (REG)');
      setTrackingNumber(order.trackingNumber || '');
      setIsEditing(false);
      router.push(`/dashboard/orders?id=${order.id}`, { scroll: false });
    },
    [router]
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedOrder(null);
    setIsEditing(false);
    router.push('/dashboard/orders', { scroll: false });
  }, [router]);

  // Save changes via React Query mutation
  const handleSaveChanges = async () => {
    if (!selectedOrder) return;
    try {
      await updateOrder({
        id: selectedOrder.id,
        status: editStatus,
        adminNotes: adminNotes,
        courierName: courierName,
        trackingNumber: trackingNumber
      });
      toast.success(`Pesanan ${selectedOrder.orderNumber} berhasil diperbarui`);
      handleCloseDetail();
    } catch (err) {
      console.error('Failed to update order:', err);
      toast.error('Gagal memperbarui pesanan');
    }
  };

  // Quick Action: Approve Order (Sets status to CONFIRMED)
  const handleApproveOrder = useCallback(
    async (order: Order, e?: React.MouseEvent) => {
      e?.stopPropagation();
      try {
        await updateOrder({
          id: order.id,
          status: 'CONFIRMED',
          adminNotes: order.adminNotes ? `${order.adminNotes} (Disetujui Admin)` : 'Disetujui Admin'
        });
        toast.success(`Order ${order.orderNumber} berhasil disetujui (CONFIRMED)`);
        if (selectedOrder?.id === order.id) {
          handleCloseDetail();
        }
      } catch (err) {
        console.error('Failed to approve order:', err);
        toast.error('Gagal menyetujui pesanan');
      }
    },
    [updateOrder, selectedOrder, handleCloseDetail]
  );

  // Quick Action: Reject Order (Sets status to REJECTED)
  const handleRejectOrder = useCallback(
    async (order: Order, e?: React.MouseEvent) => {
      e?.stopPropagation();
      try {
        await updateOrder({
          id: order.id,
          status: 'REJECTED',
          adminNotes: order.adminNotes
            ? `${order.adminNotes} (Ditolak Admin / Anti-Spam)`
            : 'Ditolak (Spam Protection)'
        });
        toast.error(`Order ${order.orderNumber} telah ditolak (REJECTED)`);
        if (selectedOrder?.id === order.id) {
          handleCloseDetail();
        }
      } catch (err) {
        console.error('Failed to reject order:', err);
        toast.error('Gagal menolak pesanan');
      }
    },
    [updateOrder, selectedOrder, handleCloseDetail]
  );

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            Pending (Review)
          </Badge>
        );
      case 'CONFIRMED':
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            Confirmed
          </Badge>
        );
      case 'WAITING_PAYMENT':
        return (
          <Badge
            variant="secondary"
            className="bg-purple-500/10 text-purple-500 border-purple-500/20"
          >
            Waiting Payment
          </Badge>
        );
      case 'PAID':
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
          >
            Paid
          </Badge>
        );
      case 'FULFILLED':
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
          >
            Fulfilled
          </Badge>
        );
      case 'REJECTED':
      case 'CANCELLED':
      case 'EXPIRED':
        return <Badge variant="destructive">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filtering by Status
  const filteredOrders = useMemo(() => {
    if (selectedStatus === 'ALL') return orders;
    return orders.filter((order) => order.status === selectedStatus);
  }, [orders, selectedStatus]);

  // Table Columns Definition for DataTable
  const columns: Column<Order>[] = useMemo(
    () => [
      {
        header: 'ID Order',
        accessorKey: 'orderNumber',
        sortable: true,
        className: 'font-bold tracking-mono text-xs'
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
          <div className="flex flex-col text-xs">
            <span className="font-semibold text-foreground">{order.fullName}</span>
            <span className="text-[10px] text-muted-foreground">+{order.whatsapp}</span>
          </div>
        )
      },
      {
        header: 'Pengiriman & Resi',
        className: 'min-w-[170px]',
        cell: (order) => (
          <div className="text-xs space-y-0.5">
            <div className="font-semibold text-foreground flex items-center gap-1">
              <span>{order.courierName || 'JNE Express'}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              Ongkir:{' '}
              <span className="font-bold text-foreground">
                {formatIDR(order.shippingFee || 15000)}
              </span>
            </div>
            {order.trackingNumber ? (
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                Resi: {order.trackingNumber}
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
          <div className="text-muted-foreground text-xs space-y-0.5">
            {order.items.map((item, idx) => (
              <div key={idx}>
                {item.name} ({item.size}){' '}
                <span className="font-bold text-foreground">x{item.quantity}</span>
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
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                Profit: +{formatIDR(order.estimatedProfit || 0)}
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
        header: 'Aksi Review',
        className: 'text-right min-w-[210px]',
        cell: (order) => (
          <div className="flex items-center justify-end gap-1.5">
            {order.status === 'PENDING' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => handleApproveOrder(order, e)}
                  disabled={isUpdating}
                  className="h-8 px-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 text-xs font-bold gap-1 cursor-pointer"
                  title="Setujui Pesanan"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Setujui</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => handleRejectOrder(order, e)}
                  disabled={isUpdating}
                  className="h-8 px-2.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20 text-xs font-bold gap-1 cursor-pointer"
                  title="Tolak Pesanan (Spam)"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Tolak</span>
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenDetail(order)}
              className="h-8 px-3 rounded-lg hover:bg-muted text-xs cursor-pointer"
            >
              Detail
            </Button>
          </div>
        )
      }
    ],
    [handleOpenDetail, handleApproveOrder, handleRejectOrder, isUpdating]
  );

  // Generate WhatsApp message template link using custom settings templates
  const storeSettings = useStoreSettingsStore();

  const getWhatsAppLink = (order: Order) => {
    let template = storeSettings.waTemplatePending;
    const statusStr = String(order.status);
    if (statusStr === 'CONFIRMED' || statusStr === 'PAID') {
      template = storeSettings.waTemplatePayment || template;
    } else if (statusStr === 'SHIPPED' || statusStr === 'FULFILLED') {
      template = storeSettings.waTemplateShipping || template;
    }

    if (!template) {
      template = `Halo {nama_pelanggan},\n\nTerima kasih telah memesan dari RIO COLLECTION.\nKami mengonfirmasi pesanan Anda dengan nomor #{nomor_order}.\n\nTotal Tagihan: {total_pembayaran}\nSilakan melakukan pembayaran via transfer bank:\n{rekening_bank}\n\nHarap kirimkan bukti transfer ke WhatsApp ini setelah melakukan pembayaran. Terima kasih!`;
    }

    const bankText = `${storeSettings.bankName || 'BCA'}: ${storeSettings.bankAccountNumber || '1234567890'} a.n ${storeSettings.bankAccountOwner || 'RIO COLLECTION'}`;

    const message = template
      .replaceAll('{nama_pelanggan}', order.fullName)
      .replaceAll('{nomor_order}', order.orderNumber)
      .replaceAll('{total_pembayaran}', formatIDR(order.totalPrice))
      .replaceAll('{rekening_bank}', bankText)
      .replaceAll('{kurir}', order.courierName || 'JNE')
      .replaceAll('{nomor_resi}', order.trackingNumber || '-');

    return `https://wa.me/${order.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
  };

  return (
    <VStack gap="lg" className="pb-10">
      <VStack gap="xs">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Kelola Pesanan</h1>
        <p className="text-sm text-muted-foreground pt-1">
          Review request pesanan masuk, lakukan aksi Setujui/Tolak untuk cegah spam, kelola resi
          pengiriman & WhatsApp
        </p>
      </VStack>

      {/* Cron Job Stale Order Auto-Cleanup Banner */}
      <div className="p-4 bg-muted/15 border border-border/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="text-xs space-y-0.5">
            <span className="font-bold text-foreground block">
              Cron Job Auto-Cleanup Pesanan Spam (24 Jam Expiry)
            </span>
            <span className="text-muted-foreground text-[11px] leading-relaxed">
              Pesanan berstatus <strong className="text-amber-500">PENDING &gt; 24 jam</strong>{' '}
              secara otomatis ditandai <strong className="text-red-500">EXPIRED</strong> via Cron
              Job untuk mencegah penumpukan spam.
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
        searchPlaceholder="Cari order number..."
        filterComponents={
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
              Filter Status:
            </span>
            <Select value={selectedStatus} onValueChange={(val) => val && setSelectedStatus(val)}>
              <SelectTrigger className="w-45 h-9 rounded-xl">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Pesanan</SelectItem>
                <SelectItem value="PENDING">Pending (Perlu Review)</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed (Disetujui)</SelectItem>
                <SelectItem value="WAITING_PAYMENT">Waiting Payment</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="FULFILLED">Fulfilled</SelectItem>
                <SelectItem value="REJECTED">Rejected (Ditolak)</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        emptyTitle="Tidak Ada Pesanan"
        emptyDescription="Tidak ada data pesanan yang cocok dengan filter atau pencarian Anda."
        pageSize={10}
      />

      {/* Detail & Edit Status Dialog */}
      <Dialog
        open={selectedOrder !== null}
        onOpenChange={(open) => {
          if (!open) handleCloseDetail();
        }}
      >
        {selectedOrder && (
          <DialogContent className="sm:max-w-3xl bg-card border-border/40 rounded-2xl">
            <DialogHeader className="border-b border-border/20 pb-4">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-muted-foreground" />
                  <span>Pesanan {selectedOrder.orderNumber}</span>
                </DialogTitle>
                <div className="pr-6">{getStatusBadge(selectedOrder.status)}</div>
              </div>
              <DialogDescription className="text-xs pt-1">
                Masuk pada{' '}
                {new Date(selectedOrder.createdAt).toLocaleString('id-ID', {
                  dateStyle: 'long',
                  timeStyle: 'short'
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2 max-h-[70vh] overflow-y-auto pr-1">
              {/* Quick Action Banner if order is PENDING */}
              {selectedOrder.status === 'PENDING' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">
                      Pesanan Membutuhkan Verifikasi Admin
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Setujui pesanan untuk memproses transaksi atau tolak jika terdeteksi spam.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleApproveOrder(selectedOrder)}
                      disabled={isUpdating}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 rounded-lg text-xs font-bold gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Setujui</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRejectOrder(selectedOrder)}
                      disabled={isUpdating}
                      className="h-8 px-3 rounded-lg text-xs font-bold gap-1 cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Tolak</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Top row: Customer + Shipping info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Customer Info Card */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                    Data Pelanggan
                  </h4>
                  <div className="bg-muted/15 p-4 rounded-xl border border-border/20 space-y-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">
                        Nama Penerima
                      </span>
                      <p className="text-sm font-bold text-foreground">{selectedOrder.fullName}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">
                        WhatsApp / Phone
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground/60" />
                        <p className="text-sm font-bold text-foreground">
                          +{selectedOrder.whatsapp}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-0.5 pt-2 border-t border-border/15">
                      <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Alamat Pengiriman
                      </span>
                      <p className="text-xs text-foreground leading-relaxed font-medium">
                        {selectedOrder.address}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shipping & Delivery Details Card */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1">
                    Detail Pengiriman & Resi
                  </h4>
                  <div className="bg-muted/15 p-4 rounded-xl border border-border/20 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">
                        Kurir / Ekspedisi
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {selectedOrder.courierName || 'JNE Express (REG)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">
                        Ongkos Kirim (Shipping Fee)
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {formatIDR(selectedOrder.shippingFee || 15000)}
                      </span>
                    </div>
                    <div className="space-y-1 pt-2 border-t border-border/15">
                      <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">
                        No. Resi Pengiriman
                      </span>
                      {selectedOrder.trackingNumber ? (
                        <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                          {selectedOrder.trackingNumber}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic bg-muted/20 p-2 rounded-lg border border-border/10">
                          Resi belum diinput (Klik Edit Status untuk menambahkan Resi)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* COGS (HPP) & Item Financial Breakdown */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center justify-between">
                  <span>Detail Item & Analisis COGS (HPP)</span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Profit Margin: ~
                    {Math.round(
                      ((selectedOrder.estimatedProfit || 0) / (selectedOrder.subtotal || 1)) * 100
                    )}
                    %
                  </span>
                </h4>

                <div className="border border-border/20 rounded-xl divide-y divide-border/15 overflow-hidden">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3.5 text-xs bg-card"
                    >
                      <div>
                        <span className="font-bold text-foreground">{item.name}</span>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-muted-foreground text-[10px]">
                          <span>
                            Size: <span className="font-bold text-foreground">{item.size}</span>
                          </span>
                          <span>
                            Harga Jual:{' '}
                            <span className="font-bold text-foreground">
                              {formatIDR(item.price)}
                            </span>
                          </span>
                          <span>
                            COGS/HPP:{' '}
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                              {formatIDR(item.cogs || 180000)}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground font-medium">Qty: </span>
                        <span className="font-extrabold text-foreground">x{item.quantity}</span>
                        <p className="font-bold text-foreground mt-0.5">
                          {formatIDR(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Financial Summary Breakdown */}
                  <div className="p-4 bg-muted/20 space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal Produk</span>
                      <span className="font-semibold text-foreground">
                        {formatIDR(selectedOrder.subtotal || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Ongkos Kirim ({selectedOrder.courierName || 'JNE'})</span>
                      <span className="font-semibold text-foreground">
                        {formatIDR(selectedOrder.shippingFee || 15000)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground border-t border-border/15 pt-2">
                      <span>Total COGS (HPP Produk)</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        -{formatIDR(selectedOrder.totalCogs || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-border/20 pt-2 font-bold text-sm">
                      <span className="text-foreground">Total Tagihan Pembayaran</span>
                      <span className="font-black text-foreground">
                        {formatIDR(selectedOrder.totalPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-2">
                      <span>Estimasi Net Profit (Laba Bersih)</span>
                      <span className="text-sm font-extrabold">
                        +{formatIDR(selectedOrder.estimatedProfit || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Notes */}
              {selectedOrder.notes && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1 font-bold">
                    <FileText className="h-3 w-3" /> Catatan Pelanggan
                  </span>
                  <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 text-xs italic text-foreground/80 rounded-xl">
                    &ldquo;{selectedOrder.notes}&rdquo;
                  </div>
                </div>
              )}

              {/* Detail Mode: read-only status + actions */}
              {!isEditing && (
                <div className="space-y-3 pt-1">
                  {selectedOrder.adminNotes && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1 font-bold">
                        <FileText className="h-3 w-3" /> Catatan Admin
                      </span>
                      <p className="text-xs text-foreground/80 leading-relaxed bg-muted/10 p-3 rounded-xl border border-border/15">
                        {selectedOrder.adminNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Edit Mode: status, courier, tracking number, admin notes */}
              {isEditing && (
                <div className="space-y-4 pt-3 border-t border-border/20 bg-muted/10 p-4 rounded-xl border">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                    Edit Detail Pesanan & Pengiriman
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-muted-foreground/70 uppercase font-bold tracking-wider">
                        Status Pesanan
                      </span>
                      <Select
                        value={editStatus}
                        onValueChange={(val) => val && setEditStatus(val as Order['status'])}
                      >
                        <SelectTrigger className="w-full h-10 rounded-xl">
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending (Request masuk)</SelectItem>
                          <SelectItem value="CONFIRMED">Confirmed (Disetujui admin)</SelectItem>
                          <SelectItem value="WAITING_PAYMENT">
                            Waiting Payment (Menunggu transfer)
                          </SelectItem>
                          <SelectItem value="PAID">Paid (Lunas / Kurangi stok)</SelectItem>
                          <SelectItem value="FULFILLED">Fulfilled (Pesanan terkirim)</SelectItem>
                          <SelectItem value="REJECTED">Rejected (Ditolak/Spam)</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] text-muted-foreground/70 uppercase font-bold tracking-wider">
                        Ekspedisi / Kurir Pengiriman
                      </span>
                      <Input
                        type="text"
                        placeholder="Contoh: JNE Express (REG), J&T, SiCepat"
                        value={courierName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCourierName(e.target.value)
                        }
                        className="h-10 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-muted-foreground/70 uppercase font-bold tracking-wider">
                      Nomor Resi Pengiriman (Tracking Code)
                    </span>
                    <Input
                      type="text"
                      placeholder="Masukkan No. Resi pengiriman paket..."
                      value={trackingNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setTrackingNumber(e.target.value)
                      }
                      className="h-10 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-muted-foreground/70 uppercase font-bold tracking-wider">
                      Catatan Internal Admin (CMS)
                    </span>
                    <Textarea
                      placeholder="Masukkan catatan privat toko (misal: sudah dikirim Resi JNE, pelanggan minta ganti size XL, dll.)"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="min-h-20 rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-border/20 pt-4 gap-2">
              {!isEditing ? (
                <>
                  <a
                    href={getWhatsAppLink(selectedOrder)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 h-10 px-5 text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all cursor-pointer select-none whitespace-nowrap shrink-0"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Hubungi WA</span>
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                  <div className="flex-1" />
                  <Button
                    variant="outline"
                    onClick={handleCloseDetail}
                    className="h-10 rounded-xl text-xs cursor-pointer"
                  >
                    Tutup
                  </Button>
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="h-10 rounded-xl text-xs cursor-pointer gap-1.5"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Status & Resi
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditStatus(selectedOrder.status);
                      setAdminNotes(selectedOrder.adminNotes || '');
                      setCourierName(selectedOrder.courierName || 'JNE Express (REG)');
                      setTrackingNumber(selectedOrder.trackingNumber || '');
                    }}
                    className="h-10 rounded-xl text-xs cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleSaveChanges}
                    disabled={isUpdating}
                    className="h-10 rounded-xl text-xs cursor-pointer"
                  >
                    {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </>
              )}
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
          <p className="text-sm text-muted-foreground animate-pulse">Loading orders panel...</p>
        </div>
      }
    >
      <OrdersPageContent />
    </Suspense>
  );
}
