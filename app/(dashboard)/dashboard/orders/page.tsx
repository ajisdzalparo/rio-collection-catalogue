'use client';

import { useState, useEffect, useMemo, useCallback, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  MessageSquare,
  Calendar,
  FileText,
  Phone,
  MapPin,
  ClipboardList,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Copy,
  Clock,
  RefreshCw,
  AlertTriangle,
  Pencil,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useOrders, type Order } from '@/hooks/use-orders';
import { useStoreSettingsStore } from '@/hooks/use-store-settings';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { VStack } from '@/components/ui/layout';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { formatIDR, formatWaNumber } from '@/lib/utils';
import { RupiahInput } from '@/components/ui/rupiah-input';
import { PaymentProofUpload } from '@/components/shared/payment-proof-upload';

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
  const [cancelTargetOrder, setCancelTargetOrder] = useState<Order | null>(null);

  // Ref to prevent re-opening modal during route transitions when closing
  const lastClosedIdRef = useRef<string | null>(null);

  // Form edit states
  const [cancelReason, setCancelReason] = useState('');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [actualShippingFee, setActualShippingFee] = useState<number>(15000);

  // WhatsApp follow up requirement states
  const [waFollowedUp, setWaFollowedUp] = useState(false);
  const [cancelWaFollowedUp, setCancelWaFollowedUp] = useState(false);
  const [isExpeditionDialogOpen, setIsExpeditionDialogOpen] = useState(false);
  const [isExpeditionConfirmOpen, setIsExpeditionConfirmOpen] = useState(false);
  const [shippingAdjustmentChoice, setShippingAdjustmentChoice] = useState<
    'REFUND' | 'WAIVE' | null
  >(null);
  const [additionalPaymentProofUrl, setAdditionalPaymentProofUrl] = useState('');
  const [refundProofUrl, setRefundProofUrl] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [shippingProofUrl, setShippingProofUrl] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const quotedShippingFee = selectedOrder?.quotedShippingFee ?? selectedOrder?.shippingFee ?? 15000;
  const shippingDifference = actualShippingFee - quotedShippingFee;
  const hasShippingDifference = shippingDifference !== 0;

  // Sync selected order from query param
  useEffect(() => {
    const timer = setTimeout(() => {
      if (paramOrderId && orders.length > 0) {
        if (paramOrderId === lastClosedIdRef.current) {
          return;
        }
        const found = orders.find((o) => o.id === paramOrderId);
        if (found) {
          setSelectedOrder(found);
          if (!selectedOrder || selectedOrder.id !== found.id) {
            setCourierName(found.courierName || 'JNE Express (REG)');
            setTrackingNumber(found.trackingNumber || '');
            setActualShippingFee(found.shippingFee ?? found.quotedShippingFee ?? 15000);
            setWaFollowedUp(false);
            setShippingAdjustmentChoice(null);
            setAdditionalPaymentProofUrl(found.additionalPaymentProofUrl || '');
            setRefundProofUrl(found.refundProofUrl || '');
            setRefundReason('');
            setShippingProofUrl(found.shippingProofUrl || '');
            setPaymentProofUrl(found.paymentProofUrl || '');
          }
        } else {
          setSelectedOrder(null);
          setWaFollowedUp(false);
        }
      } else {
        setSelectedOrder(null);
        setWaFollowedUp(false);
        lastClosedIdRef.current = null;
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [paramOrderId, orders, selectedOrder]);

  const handleOpenDetail = useCallback(
    (order: Order) => {
      lastClosedIdRef.current = null; // reset ref
      setSelectedOrder(order);
      setCourierName(order.courierName || 'JNE Express (REG)');
      setTrackingNumber(order.trackingNumber || '');
      setActualShippingFee(order.shippingFee ?? order.quotedShippingFee ?? 15000);
      setWaFollowedUp(false);
      setShippingAdjustmentChoice(null);
      setAdditionalPaymentProofUrl(order.additionalPaymentProofUrl || '');
      setRefundProofUrl(order.refundProofUrl || '');
      setRefundReason('');
      setShippingProofUrl(order.shippingProofUrl || '');
      setPaymentProofUrl(order.paymentProofUrl || '');
      router.push(`/dashboard/orders?id=${order.id}`, { scroll: false });
    },
    [router]
  );

  const handleCloseDetail = useCallback(() => {
    if (selectedOrder) {
      lastClosedIdRef.current = selectedOrder.id;
    }
    setSelectedOrder(null);
    setWaFollowedUp(false);
    setShippingAdjustmentChoice(null);
    setAdditionalPaymentProofUrl('');
    setRefundProofUrl('');
    setRefundReason('');
    setShippingProofUrl('');
    setPaymentProofUrl('');
    router.push('/dashboard/orders', { scroll: false });
  }, [router, selectedOrder]);

  // Quick Action: Approve Order (Sets status to CONFIRMED)
  const handleApproveOrder = useCallback(
    async (order: Order, e?: React.MouseEvent) => {
      e?.stopPropagation();
      try {
        await updateOrder({
          id: order.id,
          status: 'CONFIRMED'
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
  const handleRejectOrder = useCallback((order: Order, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCancelTargetOrder(order);
    setCancelWaFollowedUp(false);
  }, []);

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-amber-500 text-white border-transparent">
            Pending (Review)
          </Badge>
        );
      case 'CONFIRMED':
        return (
          <Badge variant="secondary" className="bg-blue-600 text-white border-transparent">
            Confirmed
          </Badge>
        );
      case 'WAITING_PAYMENT':
        return (
          <Badge variant="secondary" className="bg-purple-600 text-white border-transparent">
            Waiting Payment
          </Badge>
        );
      case 'PAID':
        return (
          <Badge variant="secondary" className="bg-emerald-600 text-white border-transparent">
            Paid
          </Badge>
        );
      case 'FULFILLED':
        return (
          <Badge variant="secondary" className="bg-emerald-700 text-white border-transparent">
            Fulfilled
          </Badge>
        );
      case 'REJECTED':
      case 'CANCELLED':
      case 'EXPIRED':
        return <Badge className="bg-red-600 text-white border-transparent">{status}</Badge>;
      default:
        return <Badge className="bg-zinc-600 text-white border-transparent">{status}</Badge>;
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
        className: 'min-w-[170px]',
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
                {item.isPreOrder ? (
                  <Badge
                    variant="secondary"
                    className="bg-foreground text-background border-transparent text-[9px] px-1 py-0 font-bold shrink-0"
                  >
                    PO
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-foreground text-background border-transparent text-[9px] px-1 py-0 font-bold shrink-0"
                  >
                    READY
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
              <span className="text-foreground font-bold">
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
        className: 'text-right min-w-[90px]',
        cell: (order) => (
          <div className="flex items-center justify-end gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={isUpdating}
                    aria-label={`Aksi untuk pesanan ${order.orderNumber}`}
                    className="rounded-full bg-card border-border text-foreground hover:bg-muted cursor-pointer"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-44 min-w-44">
                <DropdownMenuItem
                  onClick={() => handleOpenDetail(order)}
                  className="gap-2 cursor-pointer"
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  Detail Pesanan
                </DropdownMenuItem>
                {order.status === 'PENDING' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(event) => handleApproveOrder(order, event)}
                      disabled={isUpdating}
                      className="gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Setujui Pesanan
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(event) => handleRejectOrder(order, event)}
                      disabled={isUpdating}
                      className="gap-2 cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Tolak Pesanan
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      }
    ],
    [handleOpenDetail, handleApproveOrder, handleRejectOrder, isUpdating]
  );

  // Generate WhatsApp message template link using custom settings templates
  const storeSettings = useStoreSettingsStore();

  // Generate action specific WhatsApp templates to enforce the follow-up flow
  const getActionWaLink = (order: Order, nextStatus: Order['status']) => {
    let template = '';

    // Check if courier has been changed during fulfillment
    const isCourierChanged =
      nextStatus === 'FULFILLED' && courierName && courierName !== order.courierName;

    if (isCourierChanged) {
      const origFee = order.shippingFee || 15000;
      const diff = actualShippingFee - origFee;

      if (diff > 0) {
        template =
          'Halo {nama_pelanggan},\n\nKami menginfokan bahwa pesanan #{nomor_order} akan dikirim dengan ekspedisi {kurir} (berubah dari {kurir_awal}).\n\nKarena tarif ekspedisi baru berbeda, terdapat kekurangan ongkir sebesar {selisih}.\nMohon melakukan transfer kekurangan sebesar {selisih} ke:\n{rekening_bank}\n\nTerima kasih atas kerjasamanya!';
      } else if (diff < 0) {
        template =
          'Halo {nama_pelanggan},\n\nKami menginfokan bahwa pesanan #{nomor_order} akan dikirim dengan ekspedisi {kurir} (berubah dari {kurir_awal}).\n\nKarena tarif ekspedisi baru lebih murah, terdapat kelebihan ongkir sebesar {selisih_abs}.\nSilakan infokan nomor rekening/e-wallet Anda jika ingin kami refund kelebihan ini, atau jika Anda bersedia mengikhlaskannya. Terima kasih banyak!';
      } else {
        template =
          'Halo {nama_pelanggan},\n\nKami menginfokan bahwa pesanan #{nomor_order} akan dikirim dengan ekspedisi {kurir} (berubah dari {kurir_awal}). Biaya ongkir tetap sama. Terima kasih atas pengertiannya!';
      }
    } else {
      switch (nextStatus) {
        case 'CONFIRMED':
          template =
            'Halo {nama_pelanggan},\n\nTerima kasih telah memesan dari RIO COLLECTION!\nPesanan Anda #{nomor_order} telah kami SETUJUI.\n\nKami sedang menyiapkan rincian tagihan Anda. Harap tunggu rincian selanjutnya.';
          break;
        case 'WAITING_PAYMENT':
          template =
            storeSettings.waTemplatePending ||
            'Halo {nama_pelanggan},\n\nTerima kasih telah memesan dari RIO COLLECTION!\nKami telah menerima pesanan Anda (#{nomor_order}).\n\nTotal Tagihan: {total_pembayaran}\nSilakan melakukan pembayaran via transfer bank:\n{rekening_bank}\n\nHarap kirimkan bukti transfer ke WhatsApp ini setelah melakukan pembayaran. Terima kasih!';
          break;
        case 'PAID':
          template =
            storeSettings.waTemplatePayment ||
            'Halo {nama_pelanggan},\n\nKami dari RIO COLLECTION mengonfirmasi bahwa pembayaran untuk pesanan #{nomor_order} sebesar {total_pembayaran} telah DITERIMA & LUNAS.\n\nPesanan Anda sedang kami siapkan untuk pengiriman. Terima kasih!';
          break;
        case 'FULFILLED':
          template =
            storeSettings.waTemplateShipping ||
            'Halo {nama_pelanggan},\n\nPesanan Anda (#{nomor_order}) dari RIO COLLECTION telah dikirim via {kurir}!\nNomor Resi: {nomor_resi}\n\nTerima kasih telah berbelanja di RIO COLLECTION!';
          break;
        case 'CANCELLED':
          template =
            'Halo {nama_pelanggan},\n\nKami menginformasikan bahwa pesanan Anda #{nomor_order} dari RIO COLLECTION telah DIBATALKAN.\n\nAlasan pembatalan: {alasan_pembatalan}\n\nTerima kasih atas pengertian Anda.';
          break;
        case 'REJECTED':
          template =
            'Halo {nama_pelanggan},\n\nMohon maaf, pesanan Anda #{nomor_order} dari RIO COLLECTION telah DITOLAK.\n\nAlasan penolakan: {alasan_pembatalan}\n\nTerima kasih atas pengertian Anda.';
          break;
        default:
          template = `Halo {nama_pelanggan},\n\nUpdate untuk pesanan Anda #{nomor_order} status saat ini adalah: ${nextStatus}.`;
      }
    }

    const bankText = `${storeSettings.bankName || 'BCA'}: ${storeSettings.bankAccountNumber || '1234567890'} a.n ${storeSettings.bankAccountOwner || 'RIO COLLECTION'}`;
    const origFee = order.shippingFee || 15000;
    const diff = actualShippingFee - origFee;

    const message = template
      .replaceAll('{nama_pelanggan}', order.fullName)
      .replaceAll('{nomor_order}', order.orderNumber)
      .replaceAll('{total_pembayaran}', formatIDR(order.totalPrice))
      .replaceAll('{rekening_bank}', bankText)
      .replaceAll('{kurir}', courierName || 'JNE Express (REG)')
      .replaceAll('{kurir_awal}', order.courierName || 'Default')
      .replaceAll('{selisih}', formatIDR(diff))
      .replaceAll('{selisih_abs}', formatIDR(Math.abs(diff)))
      .replaceAll('{nomor_resi}', trackingNumber || '-')
      .replaceAll('{alasan_pembatalan}', cancelReason || 'Kondisi operasional toko');

    return `https://wa.me/${formatWaNumber(order.whatsapp)}?text=${encodeURIComponent(message)}`;
  };

  // WhatsApp link for shipping adjustment confirmations (surcharge / refund offer / waive)
  const getShippingAdjustmentWaLink = (order: Order, type: 'SURCHARGE' | 'REFUND_OFFER') => {
    const bankText = `${storeSettings.bankName || 'BCA'}: ${storeSettings.bankAccountNumber || '1234567890'} a.n ${storeSettings.bankAccountOwner || 'RIO COLLECTION'}`;
    const courierChanged = courierName !== (order.courierName || 'JNE Express (REG)');
    const courierLine = courierChanged
      ? `Ekspedisi pesanan Anda kami sesuaikan menjadi ${courierName} (sebelumnya ${order.courierName || 'JNE Express (REG)'}).`
      : `Pesanan Anda akan dikirim via ${courierName || order.courierName || 'JNE Express (REG)'}.`;

    let message = '';
    if (type === 'SURCHARGE') {
      message = `Halo ${order.fullName},\n\nUpdate pesanan #${order.orderNumber} di RIO COLLECTION.\n\n${courierLine}\n\nBiaya ongkir aktual: ${formatIDR(actualShippingFee)} (sebelumnya ${formatIDR(quotedShippingFee)}).\nTerdapat KEKURANGAN ongkir sebesar ${formatIDR(shippingDifference)}.\n\nMohon konfirmasi & transfer kekurangan tersebut ke:\n${bankText}\n\nSetelah transfer, mohon kirimkan bukti pembayarannya ke WhatsApp ini. Terima kasih!`;
    } else {
      message = `Halo ${order.fullName},\n\nUpdate pesanan #${order.orderNumber}.\n\n${courierLine}\n\nBiaya ongkir aktual lebih murah ${formatIDR(Math.abs(shippingDifference))} dari tagihan awal (${formatIDR(quotedShippingFee)}).\n\nSilakan pilih salah satu:\n1. REFUND — kirimkan nomor rekening/e-wallet Anda, kelebihan akan kami kembalikan.\n2. IKHLAS — kelebihan ongkir dikembalikan sebagai apresiasi toko.\n\nTerima kasih banyak!`;
    }

    return `https://wa.me/${formatWaNumber(order.whatsapp)}?text=${encodeURIComponent(message)}`;
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
          <Clock className="h-5 w-5 text-foreground shrink-0" />
          <div className="text-xs space-y-0.5">
            <span className="font-bold text-foreground block">
              Cron Job Auto-Cleanup Pesanan Spam (24 Jam Expiry)
            </span>
            <span className="text-muted-foreground text-[11px] leading-relaxed">
              Pesanan berstatus <strong>PENDING &gt; 24 jam</strong> secara otomatis ditandai{' '}
              <strong>EXPIRED</strong> via Cron Job untuk mencegah penumpukan spam.
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

            <div className="space-y-6 py-2 max-h-[70vh] overflow-y-auto pr-1">
              {/* Quick Action Banner if order is PENDING */}
              {selectedOrder.status === 'PENDING' && (
                <div className="p-4 bg-foreground text-background rounded-2xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold block">
                      Pesanan Membutuhkan Verifikasi Admin
                    </span>
                    <span className="text-[11px] opacity-80">
                      Setujui pesanan untuk memproses transaksi atau tolak jika terdeteksi spam.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleApproveOrder(selectedOrder)}
                      disabled={isUpdating}
                      className="bg-background text-foreground hover:bg-background/90 h-8 px-3 rounded-lg text-xs font-bold gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Setujui</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectOrder(selectedOrder)}
                      disabled={isUpdating}
                      className="h-8 px-3 rounded-lg text-xs font-bold gap-1 bg-transparent text-background border-background/30 hover:bg-background/10 hover:text-background cursor-pointer"
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
                  <div className="bg-card p-4 rounded-xl border border-border divide-y divide-border/60">
                    <div className="pb-3">
                      <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider block mb-0.5">
                        Nama Penerima
                      </span>
                      <p className="text-sm font-bold text-foreground">{selectedOrder.fullName}</p>
                    </div>
                    <div className="py-3">
                      <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider block mb-0.5">
                        WhatsApp / Phone
                      </span>
                      <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground/60" />+
                        {selectedOrder.whatsapp}
                      </p>
                    </div>
                    <div className="pt-3">
                      <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1 mb-1">
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
                    Detail Pengiriman &amp; Resi
                  </h4>
                  <div className="bg-card p-4 rounded-xl border border-border divide-y divide-border/60">
                    <div className="flex justify-between items-center pb-3">
                      <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">
                        Kurir / Ekspedisi
                      </span>
                      <span className="text-xs font-bold text-foreground text-right">
                        {selectedOrder.courierName || 'JNE Express (REG)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">
                        Ongkos Kirim
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {formatIDR(selectedOrder.shippingFee || 15000)}
                      </span>
                    </div>
                    <div className="space-y-1.5 pt-3">
                      <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">
                        No. Resi Pengiriman
                      </span>
                      {selectedOrder.trackingNumber ? (
                        <div className="flex items-center gap-2">
                          <p className="min-w-0 flex-1 truncate text-xs font-mono font-bold text-foreground bg-muted p-2 rounded-lg border border-border">
                            {selectedOrder.trackingNumber}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            aria-label="Salin nomor resi"
                            title="Salin nomor resi"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(
                                  selectedOrder.trackingNumber || ''
                                );
                                toast.success('Nomor resi berhasil disalin');
                              } catch {
                                toast.error('Nomor resi tidak dapat disalin');
                              }
                            }}
                            className="shrink-0 border-border bg-card text-foreground hover:bg-muted"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic bg-muted/20 p-2 rounded-lg border border-border/10">
                          Resi belum diinput — bisa ditambahkan lewat &ldquo;Ubah Ekspedisi &amp;
                          Ongkir&rdquo; saat status Paid.
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
                  <span className="text-[10px] font-semibold text-foreground">
                    Profit Margin: ~
                    {Math.round(
                      ((selectedOrder.estimatedProfit || 0) / (selectedOrder.subtotal || 1)) * 100
                    )}
                    %
                  </span>
                </h4>

                <div className="border border-border rounded-xl divide-y divide-border overflow-hidden bg-card">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3.5 text-xs bg-card"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-foreground">{item.name}</span>
                          {item.isPreOrder ? (
                            <Badge
                              variant="secondary"
                              className="bg-foreground text-background border-transparent text-[9px] px-1.5 py-0 font-bold"
                            >
                              PO
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-foreground text-background border-transparent text-[9px] px-1.5 py-0 font-bold"
                            >
                              READY STOCK
                            </Badge>
                          )}
                        </div>
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
                            <span className="font-bold text-foreground">
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
                  <div className="p-4 bg-muted/30 space-y-2.5 text-xs">
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
                      <span className="font-semibold text-foreground">
                        -{formatIDR(selectedOrder.totalCogs || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-border/20 pt-2 font-bold text-sm">
                      <span className="text-foreground">Total Tagihan Pembayaran</span>
                      <span className="font-black text-foreground">
                        {formatIDR(selectedOrder.totalPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-muted p-2.5 rounded-lg border border-border text-xs font-bold text-foreground mt-2">
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
                  <div className="p-3.5 bg-card border border-border text-xs italic text-foreground/80 rounded-xl">
                    &ldquo;{selectedOrder.notes}&rdquo;
                  </div>
                </div>
              )}

              {/* Payment & Shipping Proof Info */}
              {selectedOrder.status !== 'PENDING' &&
                selectedOrder.status !== 'CONFIRMED' &&
                (selectedOrder.paymentProofUrl ||
                  selectedOrder.additionalPaymentProofUrl ||
                  selectedOrder.refundProofUrl ||
                  selectedOrder.shippingProofUrl) && (
                  <div className="space-y-2">
                    <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1 font-bold">
                      <FileText className="h-3 w-3" /> Bukti Pembayaran &amp; Pengiriman
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        {
                          label: 'Bukti Pembayaran Utama',
                          url: selectedOrder.paymentProofUrl
                        },
                        {
                          label: 'Bukti Transfer Kekurangan Ongkir',
                          url: selectedOrder.additionalPaymentProofUrl
                        },
                        {
                          label: 'Bukti Refund Ongkir',
                          url: selectedOrder.refundProofUrl
                        },
                        {
                          label: 'Bukti Pengiriman (Struk Ekspedisi)',
                          url: selectedOrder.shippingProofUrl
                        }
                      ]
                        .filter((p) => !!p.url)
                        .map((proof) => (
                          <a
                            key={proof.label}
                            href={proof.url!}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2.5 p-3 bg-card border border-border rounded-xl hover:bg-muted transition-colors group"
                          >
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-foreground truncate">
                                {proof.label}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Klik untuk lihat bukti
                              </p>
                            </div>
                          </a>
                        ))}
                    </div>
                  </div>
                )}

              {/* Shipping Adjustment Info */}
              {selectedOrder.shippingAdjustmentStatus &&
                selectedOrder.shippingAdjustmentStatus !== 'NONE' && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1 font-bold">
                      <Pencil className="h-3 w-3" /> Status Selisih Ongkir
                    </span>
                    <div className="p-3.5 bg-card border border-border rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Ongkir awal (tagihan)</span>
                        <span className="font-bold text-foreground">
                          {formatIDR(
                            selectedOrder.quotedShippingFee ?? selectedOrder.shippingFee ?? 15000
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Ongkir aktual</span>
                        <span className="font-bold text-foreground">
                          {formatIDR(selectedOrder.shippingFee ?? 15000)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-bold text-foreground">
                          {selectedOrder.shippingAdjustmentStatus ===
                          'CUSTOMER_CONFIRMATION_PENDING'
                            ? (selectedOrder.shippingAdjustmentAmount ?? 0) < 0
                              ? 'Menunggu Proses Refund'
                              : 'Menunggu Konfirmasi Customer'
                            : selectedOrder.shippingAdjustmentStatus === 'CUSTOMER_CONFIRMED'
                              ? 'Disetujui Customer (Kekurangan Dibayar)'
                              : selectedOrder.shippingAdjustmentStatus === 'REFUNDED'
                                ? 'Kelebihan Direfund'
                                : 'Kelebihan Diiklaskan Customer'}
                        </span>
                      </div>
                      {selectedOrder.shippingAdjustmentNote && (
                        <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-border/60">
                          Catatan: {selectedOrder.shippingAdjustmentNote}
                        </p>
                      )}
                    </div>
                  </div>
                )}

              {/* Detail Mode: read-only status + actions */}
              {/* Detail & Action View */}
              <div className="space-y-4 pt-1">
                {/* Admin Notes Section (Always Editable inline) */}
                {/* Admin Notes (Read Only) - Hanya tampil jika status pesanan dibatalkan (CANCELLED) atau ditolak (REJECTED) */}
                {selectedOrder.adminNotes &&
                  ['CANCELLED', 'REJECTED'].includes(selectedOrder.status) && (
                    <div className="space-y-1.5 pt-2 border-t border-border/10">
                      <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1 font-bold">
                        <FileText className="h-3 w-3" /> Catatan Admin / Alasan Pembatalan
                      </span>
                      <div className="p-3.5 bg-card border border-border text-xs italic text-foreground/85 rounded-xl">
                        &ldquo;{selectedOrder.adminNotes}&rdquo;
                      </div>
                    </div>
                  )}

                {/* Pre-Order Warning Banner */}
                {selectedOrder.items.some((item) => item.isPreOrder) && (
                  <div className="p-3.5 bg-muted border border-border rounded-2xl text-xs text-foreground leading-relaxed font-semibold">
                    <strong>Mengandung Item Pre-Order (PO)</strong>
                    <p className="font-normal text-[11px] text-muted-foreground mt-0.5">
                      Pesanan ini memiliki satu atau lebih item pre-order. Pastikan produksi barang
                      PO telah selesai sebelum memproses pengiriman.
                    </p>
                  </div>
                )}

                {/* Progressive Order Actions */}
                {['PENDING', 'CONFIRMED', 'WAITING_PAYMENT', 'PAID'].includes(
                  selectedOrder.status
                ) && (
                  <div className="p-4 bg-muted/10 border border-border/20 rounded-2xl space-y-3">
                    <span className="text-[10px] text-muted-foreground/70 uppercase font-bold tracking-wider block">
                      Aksi Alur Pesanan (Progressive Step)
                    </span>

                    <div className="flex flex-col gap-3">
                      {selectedOrder.status === 'PENDING' && (
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <a
                              href={getActionWaLink(selectedOrder, 'CONFIRMED')}
                              target="_blank"
                              rel="noreferrer"
                              onClick={async () => {
                                setWaFollowedUp(true);
                                try {
                                  await updateOrder({ id: selectedOrder.id, waFollowedUp: true });
                                } catch {
                                  console.error('Failed to update waFollowedUp flag');
                                }
                              }}
                              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer select-none shrink-0 w-full sm:w-auto"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>1. Kirim WA (Notifikasi Setuju)</span>
                            </a>
                            <Button
                              onClick={(e) => handleApproveOrder(selectedOrder, e)}
                              disabled={
                                isUpdating || (!waFollowedUp && !selectedOrder.waFollowedUp)
                              }
                              className="h-9 w-full sm:flex-1 rounded-xl text-xs font-bold bg-foreground text-background hover:bg-foreground/90 cursor-pointer disabled:opacity-50"
                            >
                              2. Konfirmasi Setujui Pesanan
                            </Button>
                          </div>
                        </div>
                      )}

                      {selectedOrder.status === 'CONFIRMED' && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <a
                            href={getActionWaLink(selectedOrder, 'WAITING_PAYMENT')}
                            target="_blank"
                            rel="noreferrer"
                            onClick={async () => {
                              setWaFollowedUp(true);
                              try {
                                await updateOrder({ id: selectedOrder.id, waFollowedUp: true });
                              } catch {
                                console.error('Failed to update waFollowedUp flag');
                              }
                            }}
                            className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer select-none shrink-0 w-full sm:w-auto"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>1. Kirim WA (Tagihan Pembayaran)</span>
                          </a>
                          <Button
                            onClick={async () => {
                              try {
                                await updateOrder({
                                  id: selectedOrder.id,
                                  status: 'WAITING_PAYMENT'
                                });
                                toast.success(`Tagihan dikirim (WAITING_PAYMENT)`);
                                handleCloseDetail();
                              } catch {
                                toast.error('Gagal memperbarui status');
                              }
                            }}
                            disabled={isUpdating || (!waFollowedUp && !selectedOrder.waFollowedUp)}
                            className="h-9 w-full sm:flex-1 rounded-xl text-xs font-bold bg-foreground text-background hover:bg-foreground/90 cursor-pointer disabled:opacity-50"
                          >
                            2. Konfirmasi Kirim Tagihan
                          </Button>
                        </div>
                      )}

                      {selectedOrder.status === 'WAITING_PAYMENT' && (
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <a
                              href={getActionWaLink(selectedOrder, 'PAID')}
                              target="_blank"
                              rel="noreferrer"
                              onClick={async () => {
                                setWaFollowedUp(true);
                                try {
                                  await updateOrder({ id: selectedOrder.id, waFollowedUp: true });
                                } catch {
                                  console.error('Failed to update waFollowedUp flag');
                                }
                              }}
                              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer select-none shrink-0 w-full sm:w-auto"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>1. Kirim WA (Konfirmasi Lunas)</span>
                            </a>
                            <Button
                              onClick={async () => {
                                if (!paymentProofUrl) {
                                  toast.error('Upload bukti pembayaran customer terlebih dahulu');
                                  return;
                                }
                                try {
                                  await updateOrder({
                                    id: selectedOrder.id,
                                    status: 'PAID',
                                    paymentProofUrl
                                  });
                                  toast.success(`Pembayaran Lunas (PAID)`);
                                  handleCloseDetail();
                                } catch {
                                  toast.error('Gagal memperbarui status');
                                }
                              }}
                              disabled={
                                isUpdating ||
                                !paymentProofUrl ||
                                (!waFollowedUp && !selectedOrder.waFollowedUp)
                              }
                              className="h-9 w-full sm:flex-1 rounded-xl text-xs font-bold bg-foreground text-background hover:bg-foreground/90 cursor-pointer disabled:opacity-50"
                            >
                              2. Konfirmasi Pembayaran Lunas
                            </Button>
                          </div>
                          <PaymentProofUpload
                            label="Bukti Pembayaran Customer"
                            value={paymentProofUrl}
                            onChange={setPaymentProofUrl}
                          />
                        </div>
                      )}

                      {selectedOrder.status === 'PAID' && (
                        <div className="space-y-3 border-t border-border/10 pt-3">
                          {/* Shipping info summary — read only */}
                          <div className="flex items-center justify-between p-3 bg-muted/15 border border-border/10 rounded-2xl">
                            <div className="min-w-0">
                              <p className="text-[10px] text-muted-foreground/75 uppercase font-bold tracking-wider">
                                Pengiriman
                              </p>
                              <p className="text-xs font-bold text-foreground truncate">
                                {selectedOrder.courierName || 'JNE Express (REG)'}
                                {selectedOrder.trackingNumber
                                  ? ` — ${selectedOrder.trackingNumber}`
                                  : ''}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Ongkir: {formatIDR(selectedOrder.shippingFee || 15000)}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsExpeditionDialogOpen(true);
                                setWaFollowedUp(false);
                              }}
                              className="h-9 px-4 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Ubah Ekspedisi &amp; Ongkir
                            </Button>
                          </div>

                          {shippingDifference !== 0 &&
                            ['NONE', 'CUSTOMER_CONFIRMATION_PENDING'].includes(
                              selectedOrder.shippingAdjustmentStatus || 'NONE'
                            ) && (
                              <div className="p-3 bg-muted/60 border border-border rounded-xl text-[11px] text-foreground font-semibold leading-relaxed">
                                Masih ada selisih ongkir{' '}
                                <strong>
                                  {shippingDifference > 0
                                    ? formatIDR(shippingDifference)
                                    : formatIDR(Math.abs(shippingDifference))}
                                </strong>{' '}
                                yang belum dikonfirmasi. Buka &ldquo;Ubah Ekspedisi &amp;
                                Ongkir&rdquo; untuk menyelesaikan konfirmasi customer-nya dulu.
                              </div>
                            )}
                          <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            <a
                              href={getActionWaLink(selectedOrder, 'FULFILLED')}
                              target="_blank"
                              rel="noreferrer"
                              onClick={async () => {
                                setWaFollowedUp(true);
                                try {
                                  await updateOrder({ id: selectedOrder.id, waFollowedUp: true });
                                } catch {
                                  console.error('Failed to update waFollowedUp flag');
                                }
                              }}
                              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer select-none shrink-0 w-full sm:w-auto"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>1. Kirim WA (Konfirmasi Ekspedisi)</span>
                            </a>
                            <Button
                              onClick={async () => {
                                if (!courierName || !trackingNumber) {
                                  toast.error(
                                    'Kurir dan Nomor Resi wajib diisi untuk konfirmasi pengiriman'
                                  );
                                  return;
                                }
                                if (
                                  shippingDifference !== 0 &&
                                  ['NONE', 'CUSTOMER_CONFIRMATION_PENDING'].includes(
                                    selectedOrder.shippingAdjustmentStatus || 'NONE'
                                  )
                                ) {
                                  toast.error(
                                    'Selesaikan konfirmasi selisih ongkir dengan customer terlebih dahulu'
                                  );
                                  return;
                                }
                                if (!shippingProofUrl && !selectedOrder.shippingProofUrl) {
                                  toast.error(
                                    'Upload bukti pengiriman (struk ekspedisi) terlebih dahulu'
                                  );
                                  return;
                                }
                                try {
                                  await updateOrder({
                                    id: selectedOrder.id,
                                    status: 'FULFILLED',
                                    courierName,
                                    trackingNumber,
                                    shippingFee: actualShippingFee,
                                    shippingProofUrl:
                                      shippingProofUrl || selectedOrder.shippingProofUrl
                                  });
                                  toast.success(
                                    `Pesanan ${selectedOrder.orderNumber} berhasil dikirim (FULFILLED)`
                                  );
                                  handleCloseDetail();
                                } catch {
                                  toast.error('Gagal memproses pengiriman');
                                }
                              }}
                              disabled={
                                isUpdating ||
                                (!waFollowedUp && !selectedOrder.waFollowedUp) ||
                                (shippingDifference !== 0 &&
                                  ['NONE', 'CUSTOMER_CONFIRMATION_PENDING'].includes(
                                    selectedOrder.shippingAdjustmentStatus || 'NONE'
                                  ))
                              }
                              className="h-9 w-full sm:flex-1 rounded-xl text-xs font-bold bg-foreground text-background hover:bg-foreground/90 cursor-pointer disabled:opacity-50"
                            >
                              2. Konfirmasi Pengiriman (Fulfilled)
                            </Button>
                          </div>
                          <PaymentProofUpload
                            label="Bukti Pengiriman (Struk Ekspedisi)"
                            value={shippingProofUrl}
                            onChange={setShippingProofUrl}
                          />
                        </div>
                      )}

                      {/* Cancel Button */}
                      <div className="flex gap-2 justify-end border-t border-border/10 pt-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setCancelTargetOrder(selectedOrder);
                            setCancelWaFollowedUp(false);
                          }}
                          disabled={isUpdating}
                          className="h-9 px-4 rounded-xl text-xs font-bold border-border text-foreground hover:bg-muted cursor-pointer"
                        >
                          Batalkan Pesanan
                        </Button>
                        <Button
                          variant="outline"
                          onClick={(e) => handleRejectOrder(selectedOrder, e)}
                          disabled={isUpdating}
                          className="h-9 px-4 rounded-xl text-xs font-bold border-border bg-card text-foreground hover:bg-muted cursor-pointer"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Tolak Pesanan (Spam)
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Expedition Change Dialog — single action → alert → confirm */}
      <Dialog
        open={isExpeditionDialogOpen}
        onOpenChange={(open) => {
          setIsExpeditionDialogOpen(open);
          if (!open && !isExpeditionConfirmOpen && selectedOrder) {
            setCourierName(selectedOrder.courierName || 'JNE Express (REG)');
            setActualShippingFee(selectedOrder.shippingFee ?? quotedShippingFee);
          }
        }}
      >
        {selectedOrder && (
          <DialogContent className="sm:max-w-md bg-popover border-border text-popover-foreground p-6 rounded-[24px]">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="text-sm font-extrabold uppercase tracking-widest text-foreground">
                Ubah Ekspedisi &amp; Ongkir Aktual
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground pt-1">
                Pesanan {selectedOrder.orderNumber} — pastikan perubahan sudah disepakati dengan
                customer sebelum dikonfirmasi.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                  Ekspedisi / Kurir Pengiriman
                </label>
                <Select
                  value={courierName || ''}
                  onValueChange={(val) => setCourierName(val || '')}
                >
                  <SelectTrigger className="w-full h-10 rounded-xl text-xs bg-muted/40 border-border text-foreground">
                    <SelectValue placeholder="Pilih Kurir" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="JNE Express (REG)">JNE Express (REG)</SelectItem>
                    <SelectItem value="J&T Express">J&T Express</SelectItem>
                    <SelectItem value="SiCepat Reguler">SiCepat Reguler</SelectItem>
                    <SelectItem value="GoSend Instant">GoSend Instant</SelectItem>
                    <SelectItem value="GrabExpress Instant">GrabExpress Instant</SelectItem>
                    <SelectItem value="Pos Indonesia">Pos Indonesia</SelectItem>
                    <SelectItem value="TIKI">TIKI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="tracking-number"
                  className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block"
                >
                  Nomor Resi Pengiriman
                </label>
                <Input
                  id="tracking-number"
                  type="text"
                  placeholder="Masukkan nomor resi..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="h-10 rounded-xl text-xs font-mono font-bold bg-muted/40 border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="actual-shipping-fee"
                  className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block"
                >
                  Biaya Ongkir Aktual (Awal: {formatIDR(quotedShippingFee)})
                </label>
                <RupiahInput
                  id="actual-shipping-fee"
                  value={actualShippingFee}
                  onValueChange={setActualShippingFee}
                  className="h-10 rounded-xl text-xs bg-muted/40 border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {(courierName !== (selectedOrder.courierName || 'JNE Express (REG)') ||
                hasShippingDifference) && (
                <div className="p-3 bg-muted/60 border border-border rounded-xl text-[11px] text-foreground font-semibold leading-relaxed">
                  {courierName !== (selectedOrder.courierName || 'JNE Express (REG)') && (
                    <span className="block">
                      Anda mengganti ekspedisi dari{' '}
                      <strong>{selectedOrder.courierName || 'Default/Bawaan'}</strong> menjadi{' '}
                      <strong>{courierName}</strong>.
                    </span>
                  )}
                  {shippingDifference > 0 && (
                    <span className="block pt-1 text-foreground">
                      Kekurangan Ongkir: {formatIDR(shippingDifference)} — wajib dikonfirmasi &amp;
                      ditagihkan ke customer.
                    </span>
                  )}
                  {shippingDifference < 0 && (
                    <span className="block pt-1 text-foreground">
                      Kelebihan Ongkir: {formatIDR(Math.abs(shippingDifference))} — tawarkan refund
                      ke customer.
                    </span>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-border pt-3 flex flex-col sm:flex-row items-center justify-end gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsExpeditionDialogOpen(false)}
                className="h-10 rounded-xl text-xs font-bold border-border text-foreground hover:bg-muted cursor-pointer w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!courierName || !trackingNumber) {
                    toast.error(
                      shippingDifference === 0
                        ? 'Nomor Resi wajib diisi untuk konfirmasi pengiriman'
                        : 'Kurir dan Nomor Resi wajib diisi untuk konfirmasi perubahan'
                    );
                    return;
                  }
                  setIsExpeditionConfirmOpen(true);
                }}
                className="h-10 rounded-xl text-xs font-bold bg-foreground hover:bg-foreground/90 text-background cursor-pointer w-full sm:w-auto"
              >
                Simpan &amp; Konfirmasi
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Expedition Confirmation Dialog — staged changes → customer actions */}
      {selectedOrder && (
        <Dialog
          open={isExpeditionConfirmOpen}
          onOpenChange={(open) => {
            setIsExpeditionConfirmOpen(open);
            if (!open) {
              setIsExpeditionDialogOpen(false);
              setShippingAdjustmentChoice(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-md bg-popover border-border text-popover-foreground p-6 rounded-[24px]">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="text-sm font-extrabold uppercase tracking-widest text-foreground">
                Konfirmasi Ekspedisi &amp; Ongkir
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground pt-1">
                Pesanan {selectedOrder.orderNumber} — {selectedOrder.fullName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="rounded-xl border border-border bg-muted/20 divide-y divide-border/60">
                <div className="flex items-center justify-between p-3 gap-3">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Ekspedisi
                  </span>
                  <span className="text-xs font-bold text-foreground text-right">
                    {selectedOrder.courierName || 'JNE Express (REG)'}
                    {courierName !== (selectedOrder.courierName || 'JNE Express (REG)') && (
                      <span className="block text-[10px] text-foreground">→ {courierName}</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 gap-3">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Resi
                  </span>
                  <span className="text-xs font-mono font-bold text-foreground">
                    {trackingNumber || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 gap-3">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Ongkir
                  </span>
                  <span className="text-xs font-bold text-foreground text-right">
                    {formatIDR(quotedShippingFee)}
                    {hasShippingDifference && (
                      <span className="block text-[10px] font-bold text-muted-foreground">
                        → {formatIDR(actualShippingFee)}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {shippingDifference > 0 && (
                <div className="space-y-3">
                  <div className="p-3 bg-muted/60 border border-border rounded-xl text-[11px] text-foreground font-semibold leading-relaxed">
                    Kekurangan ongkir <strong>{formatIDR(shippingDifference)}</strong>. Kirim WA
                    konfirmasi ke customer, unggah bukti transfer kekurangan ongkir, lalu
                    konfirmasi.
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <a
                      href={getShippingAdjustmentWaLink(selectedOrder, 'SURCHARGE')}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => {
                        setWaFollowedUp(true);
                        updateOrder({
                          id: selectedOrder.id,
                          waFollowedUp: true,
                          shippingAdjustmentWaSent: true
                        }).catch(() => {
                          console.error('Failed to update shippingAdjustmentWaSent flag');
                        });
                      }}
                      className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer select-none w-full"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>1. Kirim WA (Konfirmasi Kekurangan)</span>
                    </a>
                  </div>
                  <PaymentProofUpload
                    label="Bukti Transfer Kekurangan Ongkir"
                    value={additionalPaymentProofUrl}
                    onChange={setAdditionalPaymentProofUrl}
                  />
                </div>
              )}

              {shippingDifference < 0 && (
                <div className="space-y-3">
                  <div className="p-3 bg-muted/60 border border-border rounded-xl text-[11px] text-foreground font-semibold leading-relaxed">
                    Kelebihan ongkir <strong>{formatIDR(Math.abs(shippingDifference))}</strong>.
                    Pilih tindak lanjut setelah customer memutuskan:
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <a
                      href={getShippingAdjustmentWaLink(selectedOrder, 'REFUND_OFFER')}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => {
                        setWaFollowedUp(true);
                        updateOrder({
                          id: selectedOrder.id,
                          waFollowedUp: true,
                          shippingAdjustmentWaSent: true
                        }).catch(() => {
                          console.error('Failed to update shippingAdjustmentWaSent flag');
                        });
                      }}
                      className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer select-none w-full"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>1. Kirim WA (Tawarkan Refund / Ikhlas)</span>
                    </a>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={shippingAdjustmentChoice === 'REFUND' ? 'default' : 'outline'}
                      onClick={() => setShippingAdjustmentChoice('REFUND')}
                      className="h-9 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Customer minta refund
                    </Button>
                    <Button
                      type="button"
                      variant={shippingAdjustmentChoice === 'WAIVE' ? 'default' : 'outline'}
                      onClick={() => setShippingAdjustmentChoice('WAIVE')}
                      className="h-9 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Customer ikhlas
                    </Button>
                  </div>
                  {shippingAdjustmentChoice === 'REFUND' && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="refund-reason"
                          className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block"
                        >
                          Alasan Refund (wajib)
                        </label>
                        <Textarea
                          id="refund-reason"
                          placeholder="Contoh: Ongkir aktual lebih murah, kelebihan dikembalikan via BCA..."
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          className="min-h-16 rounded-xl text-xs bg-muted/40 border-border text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                      <PaymentProofUpload
                        label="Bukti Refund Ongkir"
                        value={refundProofUrl}
                        onChange={setRefundProofUrl}
                      />
                    </div>
                  )}
                  {shippingAdjustmentChoice === 'WAIVE' && (
                    <p className="text-[11px] text-muted-foreground">
                      Kelebihan ongkir dianggap ikhlas oleh customer. Tidak ada refund yang dikirim.
                    </p>
                  )}
                </div>
              )}

              {shippingDifference === 0 && (
                <div className="p-3 bg-muted/60 border border-border rounded-xl text-[11px] text-foreground font-semibold leading-relaxed">
                  Tidak ada perubahan ekspedisi &amp; ongkir. Data resi akan langsung disimpan agar
                  pesanan bisa dikonfirmasi.
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-border pt-3 flex flex-col sm:flex-row items-center justify-end gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsExpeditionConfirmOpen(false);
                  setIsExpeditionDialogOpen(true);
                }}
                className="h-10 rounded-xl text-xs font-bold border-border text-foreground hover:bg-muted cursor-pointer w-full sm:w-auto"
              >
                Kembali Edit
              </Button>
              <Button
                type="button"
                disabled={
                  isUpdating ||
                  (shippingDifference > 0 && (!waFollowedUp || !additionalPaymentProofUrl)) ||
                  (shippingDifference < 0 && !waFollowedUp) ||
                  (shippingDifference < 0 &&
                    shippingAdjustmentChoice === 'REFUND' &&
                    (!refundProofUrl || !refundReason.trim())) ||
                  (shippingDifference < 0 && !shippingAdjustmentChoice)
                }
                onClick={async () => {
                  if (!selectedOrder) return;
                  try {
                    await updateOrder({
                      id: selectedOrder.id,
                      courierName,
                      trackingNumber,
                      shippingFee: actualShippingFee,
                      ...(shippingDifference > 0
                        ? {
                            shippingAdjustmentStatus: 'CUSTOMER_CONFIRMED' as const,
                            additionalPaymentProofUrl
                          }
                        : {}),
                      ...(shippingDifference < 0
                        ? {
                            shippingAdjustmentStatus:
                              shippingAdjustmentChoice === 'REFUND' ? 'REFUNDED' : 'REFUND_WAIVED',
                            shippingAdjustmentNote:
                              shippingAdjustmentChoice === 'REFUND'
                                ? refundReason.trim()
                                : 'Kelebihan ongkir diikhlaskan customer',
                            ...(shippingAdjustmentChoice === 'REFUND' ? { refundProofUrl } : {})
                          }
                        : {})
                    });
                    toast.success(
                      `Data ekspedisi pesanan ${selectedOrder.orderNumber} berhasil dikonfirmasi`
                    );
                    setIsExpeditionConfirmOpen(false);
                    setIsExpeditionDialogOpen(false);
                  } catch {
                    toast.error('Gagal menyimpan konfirmasi ekspedisi');
                  }
                }}
                className="h-10 rounded-xl text-xs font-bold bg-foreground hover:bg-foreground/90 text-background cursor-pointer w-full sm:w-auto"
              >
                {isUpdating ? 'Menyimpan...' : '2. Konfirmasi Perubahan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog
        open={cancelTargetOrder !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCancelTargetOrder(null);
            setCancelReason('');
            setCancelWaFollowedUp(false);
          }
        }}
      >
        {cancelTargetOrder && (
          <DialogContent className="sm:max-w-md bg-popover border-border text-popover-foreground p-6 rounded-[24px]">
            <DialogHeader className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border border-border bg-muted text-foreground">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground leading-tight mt-4">
                {cancelTargetOrder?.status === 'PENDING'
                  ? 'Konfirmasi Tolak Pesanan'
                  : 'Konfirmasi Batalkan Pesanan'}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground font-medium leading-relaxed mt-2">
                {cancelTargetOrder?.status === 'PENDING'
                  ? `Apakah Anda yakin ingin menolak pesanan ${cancelTargetOrder.orderNumber}?`
                  : `Apakah Anda yakin ingin membatalkan pesanan ${cancelTargetOrder.orderNumber}? Stok barang dalam pesanan ini akan otomatis dikembalikan ke inventaris.`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 mt-4">
              <label
                htmlFor="cancel-reason"
                className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block"
              >
                Alasan Pembatalan / Penolakan (Catatan Admin)
              </label>
              <Textarea
                id="cancel-reason"
                placeholder="Masukkan alasan pembatalan (wajib)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="min-h-20 rounded-xl text-xs bg-muted/40 border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCancelTargetOrder(null);
                  setCancelReason('');
                  setCancelWaFollowedUp(false);
                }}
                disabled={isUpdating}
                className="h-10 px-6 rounded-xl text-xs font-bold text-foreground bg-card hover:bg-muted border border-border transition-colors cursor-pointer disabled:opacity-50 w-full sm:w-auto"
              >
                Batal
              </Button>

              <Button
                type="button"
                disabled={
                  isUpdating ||
                  !cancelReason.trim() ||
                  (!cancelWaFollowedUp && !cancelTargetOrder?.waFollowedUp)
                }
                onClick={async () => {
                  if (cancelTargetOrder) {
                    try {
                      const nextStatus =
                        cancelTargetOrder.status === 'PENDING' ? 'REJECTED' : 'CANCELLED';
                      await updateOrder({
                        id: cancelTargetOrder.id,
                        status: nextStatus,
                        adminNotes: cancelReason.trim()
                      });
                      toast.success(
                        nextStatus === 'REJECTED'
                          ? `Pesanan ${cancelTargetOrder.orderNumber} berhasil ditolak`
                          : `Pesanan ${cancelTargetOrder.orderNumber} berhasil dibatalkan`
                      );
                      setCancelTargetOrder(null);
                      setCancelReason('');
                      setCancelWaFollowedUp(false);
                      handleCloseDetail();
                    } catch (err) {
                      console.error('Failed to cancel/reject order:', err);
                      toast.error('Gagal memperbarui status pesanan');
                    }
                  }
                }}
                className="h-10 px-7 rounded-xl text-xs font-extrabold bg-foreground hover:bg-foreground/90 text-background cursor-pointer disabled:opacity-50 w-full sm:w-auto"
              >
                {isUpdating
                  ? 'Memproses...'
                  : cancelTargetOrder?.status === 'PENDING'
                    ? '2. Tolak Pesanan'
                    : '2. Batalkan Pesanan'}
              </Button>

              <a
                href={
                  cancelTargetOrder
                    ? getActionWaLink(
                        cancelTargetOrder,
                        cancelTargetOrder.status === 'PENDING' ? 'REJECTED' : 'CANCELLED'
                      )
                    : '#'
                }
                target="_blank"
                rel="noreferrer"
                onClick={async () => {
                  if (!cancelReason.trim()) {
                    toast.error('Alasan pembatalan/penolakan wajib diisi terlebih dahulu');
                    return;
                  }
                  setCancelWaFollowedUp(true);
                  try {
                    await updateOrder({ id: cancelTargetOrder.id, waFollowedUp: true });
                  } catch {
                    console.error('Failed to update waFollowedUp flag');
                  }
                }}
                className="inline-flex items-center justify-center gap-1.5 h-10 px-5 text-xs font-bold bg-foreground text-background hover:bg-foreground/90 rounded-xl transition-all cursor-pointer select-none whitespace-nowrap w-full sm:w-auto shrink-0"
              >
                <MessageSquare className="h-4 w-4" />
                <span>1. Kirim WA (Notifikasi Batal)</span>
              </a>
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
