'use client';

import React, { useState, useMemo, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Copy,
  CheckCircle2,
  XCircle,
  Truck,
  Pencil,
  AlertTriangle,
  FileText,
  Package,
  TrendingUp,
  ShieldAlert,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/social-icons';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { RupiahInput } from '@/components/ui/rupiah-input';
import { PaymentProofUpload } from '@/components/shared/payment-proof-upload';
import { OrderStatusBadge } from '@/components/shared/order-status-badge';
import { useOrders, type Order } from '@/hooks/use-orders';
import { useStoreSettingsStore } from '@/hooks/use-store-settings';
import { formatIDR, formatWaNumber } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { data: orders = [], isLoading: ordersLoading, updateOrder, isUpdating } = useOrders();
  const storeSettings = useStoreSettingsStore();

  const order = useMemo(() => {
    return orders.find((o) => o.id === id || o.orderNumber === id) || null;
  }, [orders, id]);

  // Form states for shipping & status adjustments
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [actualShippingFee, setActualShippingFee] = useState<number>(15000);
  const [cancelReason, setCancelReason] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundProofUrl, setRefundProofUrl] = useState('');
  const [additionalPaymentProofUrl, setAdditionalPaymentProofUrl] = useState('');
  const [shippingAdjustmentChoice, setShippingAdjustmentChoice] = useState<'REFUND' | 'WAIVE' | null>(null);

  // Dialogs
  const [isExpeditionDialogOpen, setIsExpeditionDialogOpen] = useState(false);
  const [isExpeditionConfirmOpen, setIsExpeditionConfirmOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelMode, setCancelMode] = useState<'REJECT' | 'CANCEL'>('CANCEL');

  // Track if WA has been followed up in current session
  const [waFollowedUp, setWaFollowedUp] = useState(false);

  // Sync state from order
  const [prevOrderId, setPrevOrderId] = useState<string | null>(null);
  if (order && order.id !== prevOrderId) {
    setPrevOrderId(order.id);
    setCourierName(order.courierName || 'JNE Express (REG)');
    setTrackingNumber(order.trackingNumber || '');
    setActualShippingFee(order.shippingFee ?? order.quotedShippingFee ?? 15000);
    setAdditionalPaymentProofUrl(order.additionalPaymentProofUrl || '');
    setRefundProofUrl(order.refundProofUrl || '');
  }

  const quotedShippingFee = order?.quotedShippingFee ?? order?.shippingFee ?? 15000;
  const shippingDifference = actualShippingFee - quotedShippingFee;
  const hasShippingDifference = shippingDifference !== 0;

  const handleCopyResi = async () => {
    if (!order?.trackingNumber) return;
    try {
      await navigator.clipboard.writeText(order.trackingNumber);
      toast.success('Nomor resi berhasil disalin!');
    } catch {
      toast.error('Gagal menyalin nomor resi.');
    }
  };

  const getActionWaLink = (orderItem: Order, nextStatus: Order['status']) => {
    let template = '';
    const customMsg =
      nextStatus === 'CONFIRMED'
        ? storeSettings.waTemplatePending
        : nextStatus === 'WAITING_PAYMENT'
          ? storeSettings.waTemplatePayment
          : nextStatus === 'FULFILLED'
            ? storeSettings.waTemplateShipping
            : undefined;

    if (customMsg) {
      template = customMsg;
    } else {
      switch (nextStatus) {
        case 'CONFIRMED':
          template =
            'Halo {nama_pelanggan},\n\nPesanan Anda #{nomor_order} di RIO COLLECTION telah DIKONFIRMASI!\n\nTotal Pembayaran: {total_pembayaran}\n\nSilakan transfer ke rekening:\n{rekening_bank}\n\nSetelah transfer, mohon kirimkan bukti pembayaran ke WhatsApp ini. Terima kasih!';
          break;
        case 'WAITING_PAYMENT':
          template =
            'Halo {nama_pelanggan},\n\nBerikut tagihan untuk pesanan Anda #{nomor_order}.\nTotal: {total_pembayaran}\n\nRekening:\n{rekening_bank}\n\nMohon selesaikan pembayaran agar pesanan Anda dapat segera kami proses. Terima kasih!';
          break;
        case 'PAID':
          template =
            'Halo {nama_pelanggan},\n\nPembayaran untuk pesanan #{nomor_order} sebesar {total_pembayaran} telah kami terima. Pesanan Anda sedang disiapkan.';
          break;
        case 'FULFILLED':
          template =
            'Halo {nama_pelanggan},\n\nPesanan Anda #{nomor_order} telah dikirim via {kurir}.\nNomor Resi: {nomor_resi}\n\nTerima kasih telah berbelanja di RIO COLLECTION!';
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
          template = `Halo {nama_pelanggan},\n\nUpdate pesanan Anda #{nomor_order} saat ini berstatus: ${nextStatus}.`;
      }
    }

    const bankText = `${storeSettings.bankName || 'BCA'}: ${storeSettings.bankAccountNumber || '1234567890'} a.n ${storeSettings.bankAccountOwner || 'RIO COLLECTION'}`;
    const diff = actualShippingFee - (orderItem.shippingFee || 15000);

    const message = template
      .replaceAll('{nama_pelanggan}', orderItem.fullName)
      .replaceAll('{nomor_order}', orderItem.orderNumber)
      .replaceAll('{total_pembayaran}', formatIDR(orderItem.totalPrice))
      .replaceAll('{rekening_bank}', bankText)
      .replaceAll('{kurir}', courierName || 'JNE Express (REG)')
      .replaceAll('{kurir_awal}', orderItem.courierName || 'Default')
      .replaceAll('{selisih}', formatIDR(diff))
      .replaceAll('{selisih_abs}', formatIDR(Math.abs(diff)))
      .replaceAll('{nomor_resi}', trackingNumber || '-')
      .replaceAll('{alasan_pembatalan}', cancelReason || 'Kondisi operasional toko');

    return `https://wa.me/${formatWaNumber(orderItem.whatsapp)}?text=${encodeURIComponent(message)}`;
  };

  const getShippingAdjustmentWaLink = (orderItem: Order, type: 'SURCHARGE' | 'REFUND_OFFER') => {
    const bankText = `${storeSettings.bankName || 'BCA'}: ${storeSettings.bankAccountNumber || '1234567890'} a.n ${storeSettings.bankAccountOwner || 'RIO COLLECTION'}`;
    const courierLine =
      courierName !== (orderItem.courierName || 'JNE Express (REG)')
        ? `Ekspedisi pesanan Anda kami sesuaikan menjadi ${courierName} (sebelumnya ${orderItem.courierName || 'JNE Express (REG)'}).`
        : `Pesanan Anda akan dikirim via ${courierName || orderItem.courierName || 'JNE Express (REG)'}.`;

    let message = '';
    if (type === 'SURCHARGE') {
      message = `Halo ${orderItem.fullName},\n\nUpdate pesanan #${orderItem.orderNumber} di RIO COLLECTION.\n\n${courierLine}\n\nBiaya ongkir aktual: ${formatIDR(actualShippingFee)} (sebelumnya ${formatIDR(quotedShippingFee)}).\nTerdapat KEKURANGAN ongkir sebesar ${formatIDR(shippingDifference)}.\n\nMohon konfirmasi & transfer kekurangan tersebut ke:\n${bankText}\n\nSetelah transfer, mohon kirimkan bukti pembayarannya ke WhatsApp ini. Terima kasih!`;
    } else {
      message = `Halo ${orderItem.fullName},\n\nUpdate pesanan #${orderItem.orderNumber}.\n\n${courierLine}\n\nBiaya ongkir aktual lebih murah ${formatIDR(Math.abs(shippingDifference))} dari tagihan awal (${formatIDR(quotedShippingFee)}).\n\nSilakan pilih salah satu:\n1. REFUND — kirimkan nomor rekening/e-wallet Anda, kelebihan akan kami kembalikan.\n2. IKHLAS — kelebihan ongkir dikembalikan sebagai apresiasi toko.\n\nTerima kasih banyak!`;
    }

    return `https://wa.me/${formatWaNumber(orderItem.whatsapp)}?text=${encodeURIComponent(message)}`;
  };

  if (ordersLoading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse font-medium">
          Memuat rincian pesanan...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center text-center p-6 space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h3 className="text-xl font-bold text-foreground">Pesanan Tidak Ditemukan</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Pesanan dengan ID &quot;{id}&quot; tidak ditemukan atau telah dihapus dari sistem.
        </p>
        <Button onClick={() => router.push('/dashboard/orders')} className="rounded-xl font-bold text-xs">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          <span>Kembali ke Daftar Pesanan</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
            <Link
              href="/dashboard/orders"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kelola Pesanan</span>
            </Link>
            <span>/</span>
            <span className="text-foreground font-mono font-bold">{order.orderNumber}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap pt-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Pesanan #{order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Dibuat pada{' '}
              {new Date(order.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`https://wa.me/${formatWaNumber(order.whatsapp)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <WhatsAppIcon size={16} className="h-4 w-4" />
            <span>Chat WhatsApp Customer</span>
          </a>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/orders')}
            className="h-10 rounded-xl text-xs font-bold border-border/60"
          >
            Kembali ke Daftar
          </Button>
        </div>
      </div>

      {/* Main Content: 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (8 Cols): Ordered Items, COGS Breakdown, Proofs, and Progressive Action Flow */}
        <div className="lg:col-span-8 space-y-6">
          {/* Pre-Order Warning Banner if applicable */}
          {order.items.some((item) => item.isPreOrder) && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-foreground leading-relaxed flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-600 dark:text-amber-400 font-bold block">
                  Pesanan Mengandung Item Pre-Order (PO)
                </strong>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  Pesanan ini memiliki satu atau lebih kaos pre-order. Pastikan jadwal produksi telah
                  selesai sebelum melakukan pengiriman barang.
                </p>
              </div>
            </div>
          )}

          {/* Ordered Items & COGS Breakdown Card */}
          <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-border/20 pb-3.5">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Detail Item &amp; Analisis COGS (HPP)
                </h3>
              </div>
              <span className="text-[11px] font-bold text-muted-foreground">
                Profit Margin: ~
                {order.totalPrice > 0
                  ? (
                      ((order.estimatedProfit || order.totalPrice - (order.totalCogs || 0)) /
                        order.totalPrice) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </span>
            </div>

            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-muted/15 border border-border/25 rounded-2xl gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-foreground">{item.name}</span>
                      <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                        {item.size}
                      </Badge>
                      {item.isPreOrder && (
                        <Badge
                          variant="secondary"
                          className="bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-bold"
                        >
                          PRE-ORDER
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>Harga Jual: {formatIDR(item.price)}</span>
                      <span>•</span>
                      <span>HPP (Modal): {formatIDR(item.cogs || 180000)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/20">
                    <span className="text-xs text-muted-foreground font-semibold">
                      Qty: <strong className="text-foreground">{item.quantity} pcs</strong>
                    </span>
                    <span className="text-xs font-black text-foreground">
                      {formatIDR(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary Calculation */}
            <div className="pt-3 border-t border-border/20 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal Produk</span>
                <span className="font-bold text-foreground">
                  {formatIDR(order.subtotal || order.totalPrice - (order.shippingFee || 15000))}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Ongkos Kirim ({order.courierName || 'JNE Express'})</span>
                <span className="font-bold text-foreground">
                  {formatIDR(order.shippingFee || 15000)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total Modal Produksi (HPP)</span>
                <span className="font-bold text-rose-500">
                  -{formatIDR(order.totalCogs || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-foreground pt-2 border-t border-border/20">
                <span>Total Tagihan Pembayaran</span>
                <span className="text-primary">{formatIDR(order.totalPrice)}</span>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400">
                <span className="flex items-center gap-1.5 text-xs">
                  <TrendingUp className="h-4 w-4" />
                  <span>Estimasi Net Profit (Laba Bersih)</span>
                </span>
                <span className="text-sm font-black">
                  +{formatIDR(order.estimatedProfit || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Proofs & Shipping Documents Gallery */}
          {(order.paymentProofUrl ||
            order.additionalPaymentProofUrl ||
            order.refundProofUrl ||
            order.shippingProofUrl) && (
            <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-border/20 pb-3">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Bukti Pembayaran &amp; Berkas Pengiriman
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    label: 'Bukti Pembayaran Utama',
                    url: order.paymentProofUrl,
                    desc: 'Transfer pelunasan pesanan'
                  },
                  {
                    label: 'Bukti Transfer Kekurangan Ongkir',
                    url: order.additionalPaymentProofUrl,
                    desc: 'Pelunasan selisih ongkir'
                  },
                  {
                    label: 'Bukti Refund Ongkir',
                    url: order.refundProofUrl,
                    desc: 'Pengembalian kelebihan dana'
                  },
                  {
                    label: 'Bukti Pengiriman (Struk Resi)',
                    url: order.shippingProofUrl,
                    desc: 'Struk / resi fisik ekspedisi'
                  }
                ]
                  .filter((p) => Boolean(p.url))
                  .map((proof) => (
                    <a
                      key={proof.label}
                      href={proof.url!}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3.5 bg-muted/15 border border-border/30 rounded-2xl hover:bg-muted/30 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-xs font-bold text-foreground truncate">{proof.label}</p>
                          <p className="text-[10px] text-muted-foreground">{proof.desc}</p>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-2" />
                    </a>
                  ))}
              </div>
            </div>
          )}

          {/* Shipping Adjustment Section */}
          {order.shippingAdjustmentStatus && order.shippingAdjustmentStatus !== 'NONE' && (
            <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-border/20 pb-3">
                <div className="flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Status Selisih Ongkir
                  </h3>
                </div>
              </div>

              <div className="p-4 bg-muted/15 border border-border/30 rounded-2xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ongkir awal (tagihan pesanan)</span>
                  <span className="font-bold text-foreground">
                    {formatIDR(order.quotedShippingFee ?? order.shippingFee ?? 15000)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ongkir aktual ekspedisi</span>
                  <span className="font-bold text-foreground">
                    {formatIDR(order.shippingFee ?? 15000)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border/20">
                  <span className="text-muted-foreground font-semibold">Status Penyesuaian</span>
                  <span className="font-extrabold text-foreground">
                    {order.shippingAdjustmentStatus === 'REFUND_WAIVED' ||
                    order.shippingAdjustmentNote?.includes('diikhlaskan')
                      ? 'Diikhlaskan Customer (Tidak Perlu Refund)'
                      : order.shippingAdjustmentStatus === 'REFUNDED'
                        ? 'Kelebihan Telah Direfund'
                        : order.shippingAdjustmentStatus === 'CUSTOMER_CONFIRMED'
                          ? 'Disetujui Customer (Kekurangan Dibayar)'
                          : (order.shippingAdjustmentAmount ?? 0) < 0
                            ? 'Menunggu Konfirmasi Customer (Tawaran Refund / Ikhlas)'
                            : 'Menunggu Konfirmasi Customer (Kekurangan Ongkir)'}
                  </span>
                </div>
                {order.shippingAdjustmentNote && (
                  <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-border/20">
                    Catatan: {order.shippingAdjustmentNote}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Progressive Order Actions & Workflow Steps */}
          {['PENDING', 'CONFIRMED', 'WAITING_PAYMENT', 'PAID'].includes(order.status) && (
            <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Aksi Alur Pesanan (Progressive Step Workflow)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Lakukan langkah di bawah secara bertahap untuk memproses pesanan dan mengabari customer.
                </p>
              </div>

              {/* Step for PENDING status */}
              {order.status === 'PENDING' && (
                <div className="space-y-3 p-4 bg-muted/15 border border-border/30 rounded-2xl">
                  <span className="text-xs font-bold text-foreground block">
                    Tahap 1: Verifikasi &amp; Konfirmasi Pesanan Masuk
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <a
                      href={getActionWaLink(order, 'CONFIRMED')}
                      target="_blank"
                      rel="noreferrer"
                      onClick={async () => {
                        setWaFollowedUp(true);
                        try {
                          await updateOrder({ id: order.id, waFollowedUp: true });
                        } catch {
                          console.error('Failed to update waFollowedUp');
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-bold bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer select-none"
                    >
                      <WhatsAppIcon size={16} className="h-4 w-4" />
                      <span>1. Kirim WA (Notifikasi Setuju)</span>
                    </a>

                    <Button
                      onClick={async () => {
                        try {
                          await updateOrder({ id: order.id, status: 'CONFIRMED' });
                          toast.success(`Pesanan ${order.orderNumber} berhasil dikonfirmasi!`);
                        } catch {
                          toast.error('Gagal memperbarui status');
                        }
                      }}
                      disabled={isUpdating || (!waFollowedUp && !order.waFollowedUp)}
                      className="h-10 rounded-xl text-xs font-bold bg-foreground text-background hover:bg-foreground/90 cursor-pointer disabled:opacity-50"
                    >
                      2. Setujui Pesanan (CONFIRMED)
                    </Button>
                  </div>
                </div>
              )}

              {/* Step for CONFIRMED status */}
              {order.status === 'CONFIRMED' && (
                <div className="space-y-3 p-4 bg-muted/15 border border-border/30 rounded-2xl">
                  <span className="text-xs font-bold text-foreground block">
                    Tahap 2: Kirim Tagihan &amp; Tunggu Pembayaran
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <a
                      href={getActionWaLink(order, 'WAITING_PAYMENT')}
                      target="_blank"
                      rel="noreferrer"
                      onClick={async () => {
                        setWaFollowedUp(true);
                        try {
                          await updateOrder({ id: order.id, waFollowedUp: true });
                        } catch {
                          console.error('Failed to update waFollowedUp');
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-bold bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer select-none"
                    >
                      <WhatsAppIcon size={16} className="h-4 w-4" />
                      <span>1. Kirim WA (Tagihan Rekening)</span>
                    </a>

                    <Button
                      onClick={async () => {
                        try {
                          await updateOrder({ id: order.id, status: 'WAITING_PAYMENT' });
                          toast.success(`Status pesanan diubah ke Menunggu Pembayaran`);
                        } catch {
                          toast.error('Gagal memperbarui status');
                        }
                      }}
                      disabled={isUpdating || (!waFollowedUp && !order.waFollowedUp)}
                      className="h-10 rounded-xl text-xs font-bold bg-foreground text-background hover:bg-foreground/90 cursor-pointer disabled:opacity-50"
                    >
                      2. Ubah ke Waiting Payment
                    </Button>
                  </div>
                </div>
              )}

              {/* Step for WAITING_PAYMENT status */}
              {order.status === 'WAITING_PAYMENT' && (
                <div className="space-y-4 p-4 bg-muted/15 border border-border/30 rounded-2xl">
                  <span className="text-xs font-bold text-foreground block">
                    Tahap 3: Verifikasi Bukti Pembayaran Masuk
                  </span>
                  <PaymentProofUpload
                    label="Unggah Bukti Transfer Pembayaran Customer"
                    value={order.paymentProofUrl || ''}
                    onChange={async (url) => {
                      try {
                        await updateOrder({ id: order.id, paymentProofUrl: url });
                        toast.success('Bukti pembayaran berhasil disimpan!');
                      } catch {
                        toast.error('Gagal menyimpan bukti pembayaran');
                      }
                    }}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <a
                      href={getActionWaLink(order, 'PAID')}
                      target="_blank"
                      rel="noreferrer"
                      onClick={async () => {
                        setWaFollowedUp(true);
                        try {
                          await updateOrder({ id: order.id, waFollowedUp: true });
                        } catch {
                          console.error('Failed to update waFollowedUp');
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-bold bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer select-none"
                    >
                      <WhatsAppIcon size={16} className="h-4 w-4" />
                      <span>1. Kirim WA (Pembayaran Diterima)</span>
                    </a>

                    <Button
                      onClick={async () => {
                        try {
                          await updateOrder({ id: order.id, status: 'PAID' });
                          toast.success(`Status pesanan diubah ke PAID (Lunas)!`);
                        } catch {
                          toast.error('Gagal memperbarui status');
                        }
                      }}
                      disabled={isUpdating || (!waFollowedUp && !order.waFollowedUp)}
                      className="h-10 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      <span>2. Verifikasi Lunas (PAID)</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Step for PAID status */}
              {order.status === 'PAID' && (
                <div className="space-y-4 p-4 bg-muted/15 border border-border/30 rounded-2xl">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-foreground block">
                      Tahap 4: Pengiriman Paket &amp; Input Nomor Resi
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsExpeditionDialogOpen(true)}
                      className="h-8 rounded-xl text-xs font-bold border-border/60 gap-1.5"
                    >
                      <Truck className="h-3.5 w-3.5 text-primary" />
                      <span>Ubah Kurir / Ongkir Aktual</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">
                        Kurir Terpilih
                      </label>
                      <Input
                        value={courierName || order.courierName || 'JNE Express (REG)'}
                        onChange={(e) => setCourierName(e.target.value)}
                        placeholder="Nama Kurir..."
                        className="h-10 text-xs rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">
                        Nomor Resi Pengiriman
                      </label>
                      <Input
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Contoh: JNE1234567890"
                        className="h-10 text-xs rounded-xl font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <a
                      href={getActionWaLink(order, 'FULFILLED')}
                      target="_blank"
                      rel="noreferrer"
                      onClick={async () => {
                        setWaFollowedUp(true);
                        try {
                          await updateOrder({ id: order.id, waFollowedUp: true });
                        } catch {
                          console.error('Failed to update waFollowedUp');
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-bold bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer select-none"
                    >
                      <WhatsAppIcon size={16} className="h-4 w-4" />
                      <span>1. Kirim WA (Resi &amp; Dikirim)</span>
                    </a>

                    <Button
                      onClick={async () => {
                        if (!trackingNumber.trim()) {
                          toast.error('Nomor resi wajib diisi sebelum menyelesaikan pesanan.');
                          return;
                        }
                        try {
                          await updateOrder({
                            id: order.id,
                            status: 'FULFILLED',
                            courierName,
                            trackingNumber: trackingNumber.trim()
                          });
                          toast.success(`Pesanan ${order.orderNumber} berhasil dikirim (FULFILLED)!`);
                        } catch {
                          toast.error('Gagal memperbarui status');
                        }
                      }}
                      disabled={isUpdating || (!waFollowedUp && !order.waFollowedUp)}
                      className="h-10 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer disabled:opacity-50"
                    >
                      <Truck className="h-4 w-4 mr-1.5" />
                      <span>2. Konfirmasi Kirim (FULFILLED)</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Danger Zone Actions: Cancel or Reject */}
              <div className="pt-3 border-t border-border/20 flex items-center justify-end gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCancelMode('CANCEL');
                    setIsCancelDialogOpen(true);
                  }}
                  disabled={isUpdating}
                  className="h-9 px-4 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 border-border/40"
                >
                  Batalkan Pesanan
                </Button>
                {order.status === 'PENDING' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCancelMode('REJECT');
                      setIsCancelDialogOpen(true);
                    }}
                    disabled={isUpdating}
                    className="h-9 px-4 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 border-border/40"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    <span>Tolak Pesanan (Spam)</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (4 Cols): Customer Info, Delivery Address & Tracking, Admin Notes */}
        <div className="lg:col-span-4 space-y-6">
          {/* Customer Profile Card */}
          <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/20 pb-2.5">
              Data Pelanggan
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Nama Penerima
                </span>
                <p className="text-sm font-extrabold text-foreground">{order.fullName}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  WhatsApp / Telepon
                </span>
                <div className="flex items-center justify-between pt-0.5">
                  <p className="text-xs font-mono font-bold text-foreground">+{order.whatsapp}</p>
                  <a
                    href={`https://wa.me/${formatWaNumber(order.whatsapp)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <WhatsAppIcon size={12} className="h-3 w-3" />
                    <span>Chat WA</span>
                  </a>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Alamat Pengiriman
                </span>
                <p className="text-xs text-foreground font-medium leading-relaxed pt-0.5">
                  {order.address || 'Tanpa alamat tercatat.'}
                </p>
              </div>

              {order.notes && (
                <div className="p-3 bg-muted/20 border border-border/25 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Catatan Khusus Pembeli:
                  </span>
                  <p className="text-xs italic text-foreground">&ldquo;{order.notes}&rdquo;</p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery & Tracking Number Card */}
          <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/20 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Detail Pengiriman &amp; Resi
              </h3>
              <Truck className="h-4 w-4 text-primary" />
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kurir / Ekspedisi</span>
                <span className="font-bold text-foreground">
                  {order.courierName || 'JNE Express (REG)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ongkos Kirim</span>
                <span className="font-bold text-foreground">
                  {formatIDR(order.shippingFee || 15000)}
                </span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border/20">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Nomor Resi Pengiriman
                </span>
                {order.trackingNumber ? (
                  <div className="flex items-center justify-between p-2.5 bg-muted/20 border border-border/30 rounded-xl">
                    <span className="font-mono font-bold text-xs text-foreground">
                      {order.trackingNumber}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleCopyResi}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Salin Nomor Resi"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Belum ada nomor resi.</p>
                )}
              </div>
            </div>
          </div>

          {/* Admin Notes & Reason History */}
          {order.adminNotes && (
            <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-xs space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Catatan Internal Admin
              </h3>
              <p className="text-xs text-foreground italic p-3 bg-muted/20 border border-border/25 rounded-xl">
                &ldquo;{order.adminNotes}&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Expedition Change Dialog */}
      <Dialog open={isExpeditionDialogOpen} onOpenChange={setIsExpeditionDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/50 p-6 rounded-3xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-foreground">
              Ubah Ekspedisi &amp; Ongkir Aktual
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Sesuaikan kurir dan biaya ongkos kirim riil ekspedisi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Pilih Kurir</label>
              <Select value={courierName} onValueChange={(v) => v && setCourierName(v)}>
                <SelectTrigger className="h-10 rounded-xl text-xs bg-muted/20">
                  <SelectValue placeholder="Pilih Kurir" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
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
              <label className="text-xs font-bold text-foreground">Nomor Resi</label>
              <Input
                type="text"
                placeholder="Masukkan resi..."
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="h-10 rounded-xl text-xs font-mono font-bold bg-muted/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Biaya Ongkir Aktual (Awal: {formatIDR(quotedShippingFee)})
              </label>
              <RupiahInput
                value={actualShippingFee}
                onValueChange={setActualShippingFee}
                className="h-10 rounded-xl text-xs bg-muted/20"
              />
            </div>

            {hasShippingDifference && (
              <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/30 text-xs font-semibold space-y-1">
                {shippingDifference > 0 ? (
                  <span className="text-foreground">
                    Kekurangan Ongkir: <strong>{formatIDR(shippingDifference)}</strong> (Tagihkan ke
                    customer).
                  </span>
                ) : (
                  <span className="text-foreground">
                    Kelebihan Ongkir: <strong>{formatIDR(Math.abs(shippingDifference))}</strong>{' '}
                    (Tawarkan refund/ikhlas ke customer).
                  </span>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsExpeditionDialogOpen(false)}
              className="h-9 rounded-xl text-xs font-semibold"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!courierName || !trackingNumber.trim()) {
                  toast.error('Kurir dan nomor resi wajib diisi');
                  return;
                }
                setIsExpeditionDialogOpen(false);
                setIsExpeditionConfirmOpen(true);
              }}
              className="h-9 rounded-xl text-xs font-bold bg-foreground text-background hover:bg-foreground/90"
            >
              Lanjutkan Konfirmasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expedition Surcharge / Refund Confirmation Dialog */}
      <Dialog open={isExpeditionConfirmOpen} onOpenChange={setIsExpeditionConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/50 p-6 rounded-3xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-foreground">
              Konfirmasi Ekspedisi &amp; Selisih
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tindak lanjut biaya ongkos kirim pesanan #{order.orderNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {shippingDifference > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-foreground">
                  Kekurangan ongkir sebesar <strong>{formatIDR(shippingDifference)}</strong>. Kirim
                  notifikasi WA dan unggah bukti transfer kekurangan ongkir.
                </p>
                <a
                  href={getShippingAdjustmentWaLink(order, 'SURCHARGE')}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setWaFollowedUp(true)}
                  className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl text-xs font-bold bg-foreground text-background w-full"
                >
                  <WhatsAppIcon size={14} className="h-3.5 w-3.5" />
                  <span>1. Kirim WA Kekurangan Ongkir</span>
                </a>
                <PaymentProofUpload
                  label="Bukti Transfer Kekurangan Ongkir"
                  value={additionalPaymentProofUrl}
                  onChange={setAdditionalPaymentProofUrl}
                />
              </div>
            )}

            {shippingDifference < 0 && (
              <div className="space-y-3">
                <p className="text-xs text-foreground">
                  Kelebihan ongkir sebesar{' '}
                  <strong>{formatIDR(Math.abs(shippingDifference))}</strong>. Pilih keputusan customer:
                </p>
                <a
                  href={getShippingAdjustmentWaLink(order, 'REFUND_OFFER')}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setWaFollowedUp(true)}
                  className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl text-xs font-bold bg-foreground text-background w-full"
                >
                  <WhatsAppIcon size={14} className="h-3.5 w-3.5" />
                  <span>1. Kirim WA Tawaran Refund</span>
                </a>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={shippingAdjustmentChoice === 'REFUND' ? 'default' : 'outline'}
                    onClick={() => setShippingAdjustmentChoice('REFUND')}
                    className="h-9 rounded-xl text-xs font-bold"
                  >
                    Customer minta refund
                  </Button>
                  <Button
                    type="button"
                    variant={shippingAdjustmentChoice === 'WAIVE' ? 'default' : 'outline'}
                    onClick={() => setShippingAdjustmentChoice('WAIVE')}
                    className="h-9 rounded-xl text-xs font-bold"
                  >
                    Customer ikhlas
                  </Button>
                </div>
                {shippingAdjustmentChoice === 'REFUND' && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Alasan / no rekening refund..."
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="text-xs rounded-xl"
                    />
                    <PaymentProofUpload
                      label="Unggah Bukti Transfer Refund"
                      value={refundProofUrl}
                      onChange={setRefundProofUrl}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsExpeditionConfirmOpen(false)}
              className="h-9 rounded-xl text-xs font-semibold"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={
                isUpdating ||
                (shippingDifference > 0 && (!waFollowedUp || !additionalPaymentProofUrl)) ||
                (shippingDifference < 0 && !shippingAdjustmentChoice)
              }
              onClick={async () => {
                try {
                  await updateOrder({
                    id: order.id,
                    courierName,
                    trackingNumber,
                    shippingFee: actualShippingFee,
                    ...(shippingDifference > 0
                      ? {
                          shippingAdjustmentStatus: 'CUSTOMER_CONFIRMED',
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
                  toast.success('Data ekspedisi berhasil diperbarui!');
                  setIsExpeditionConfirmOpen(false);
                } catch {
                  toast.error('Gagal menyimpan konfirmasi');
                }
              }}
              className="h-9 rounded-xl text-xs font-bold bg-foreground text-background hover:bg-foreground/90"
            >
              {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel / Reject Order Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/50 p-6 rounded-3xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-foreground">
              {cancelMode === 'REJECT' ? 'Konfirmasi Tolak Pesanan' : 'Konfirmasi Batalkan Pesanan'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {cancelMode === 'REJECT'
                ? `Tolak pesanan #${order.orderNumber} yang dicurigai sebagai order palsu/spam.`
                : `Batalkan pesanan #${order.orderNumber}. Stok barang akan dikembalikan ke inventaris.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Alasan Pembatalan (Wajib)</label>
              <Textarea
                placeholder="Tuliskan alasan pembatalan..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="text-xs rounded-xl min-h-20"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
              className="h-9 rounded-xl text-xs font-semibold"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isUpdating || !cancelReason.trim()}
              onClick={async () => {
                try {
                  const targetStatus = cancelMode === 'REJECT' ? 'REJECTED' : 'CANCELLED';
                  await updateOrder({
                    id: order.id,
                    status: targetStatus,
                    adminNotes: cancelReason.trim()
                  });
                  toast.success(`Pesanan ${order.orderNumber} berhasil dibatalkan.`);
                  setIsCancelDialogOpen(false);
                } catch {
                  toast.error('Gagal membatalkan pesanan');
                }
              }}
              className="h-9 rounded-xl text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUpdating ? 'Memproses...' : 'Konfirmasi Batalkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
