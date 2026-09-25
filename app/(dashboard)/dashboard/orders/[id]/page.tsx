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
  ExternalLink,
  Eye,
  Printer
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
import { CmsPageSkeleton } from '@/components/shared/cms-page-skeleton';
import { Stepper } from '@/components/ui/stepper';
import { useOrders, type Order } from '@/hooks/use-orders';
import { useStoreSettingsQuery, useStoreSettingsStore } from '@/hooks/use-store-settings';
import { useStoreBanksQuery } from '@/hooks/use-store-banks';
import { formatIDR, formatWaNumber } from '@/lib/utils';
import { getEnabledCourierOptions } from '@/lib/couriers';
import {
  buildWhatsAppMessage,
  formatStoreBankDetails,
  type WhatsAppMessageStage
} from '@/lib/order-whatsapp';
import { OrderInvoiceDialog } from '@/components/dashboard/order-invoice-dialog';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { data: orders = [], isLoading: ordersLoading, updateOrder, isUpdating } = useOrders();
  const persistedStoreSettings = useStoreSettingsStore();
  const { data: latestStoreSettings } = useStoreSettingsQuery();
  const { data: storeBanks = [] } = useStoreBanksQuery();
  const storeSettings = latestStoreSettings || persistedStoreSettings;

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
  const [shippingAdjustmentChoice, setShippingAdjustmentChoice] = useState<
    'REFUND' | 'WAIVE' | null
  >(null);

  // Dialogs
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isExpeditionDialogOpen, setIsExpeditionDialogOpen] = useState(false);
  const [isExpeditionConfirmOpen, setIsExpeditionConfirmOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelMode, setCancelMode] = useState<'REJECT' | 'CANCEL'>('CANCEL');
  const [selectedProof, setSelectedProof] = useState<{
    label: string;
    url: string;
    desc: string;
  } | null>(null);

  const [openedWhatsApp, setOpenedWhatsApp] = useState<{
    orderId: string;
    stage: WhatsAppMessageStage;
  } | null>(null);
  const [shippingAdjustmentWaOpened, setShippingAdjustmentWaOpened] = useState(false);
  const [shippingAdjustmentWaConfirmed, setShippingAdjustmentWaConfirmed] = useState(false);

  // Sync state from order
  const [prevOrderId, setPrevOrderId] = useState<string | null>(null);
  if (order && order.id !== prevOrderId) {
    setPrevOrderId(order.id);
    setCourierName(order.courierName || '');
    setTrackingNumber(order.trackingNumber || '');
    setActualShippingFee(order.shippingFee ?? order.quotedShippingFee ?? 15000);
    setAdditionalPaymentProofUrl(order.additionalPaymentProofUrl || '');
    setRefundProofUrl(order.refundProofUrl || '');
  }

  const quotedShippingFee = order?.quotedShippingFee ?? order?.shippingFee ?? 15000;
  const shippingDifference = actualShippingFee - quotedShippingFee;
  const hasShippingDifference = shippingDifference !== 0;
  const courierOptions = useMemo(
    () =>
      getEnabledCourierOptions(storeSettings.enabledCouriers, courierName || order?.courierName),
    [courierName, order?.courierName, storeSettings.enabledCouriers]
  );
  const resolvedShippingAdjustmentStatuses = [
    'NONE',
    'CUSTOMER_CONFIRMED',
    'REFUNDED',
    'REFUND_WAIVED'
  ];
  const isShippingAdjustmentResolved = resolvedShippingAdjustmentStatuses.includes(
    order?.shippingAdjustmentStatus || 'NONE'
  );
  const workflowStep =
    order?.status === 'PENDING'
      ? 0
      : order?.status === 'CONFIRMED' || order?.status === 'WAITING_PAYMENT'
        ? 1
        : 2;
  const workflowSteps = [
    {
      id: 'order',
      title: 'Order & Tagihan',
      description: 'Konfirmasi pesanan',
      icon: FileText,
      isCompleted: Boolean(order && order.status !== 'PENDING')
    },
    {
      id: 'payment',
      title: 'Pembayaran',
      description: 'Verifikasi transfer',
      icon: CheckCircle2,
      isCompleted: Boolean(order && ['PAID', 'FULFILLED'].includes(order.status))
    },
    {
      id: 'shipping',
      title: 'Pengiriman',
      description: 'Kurir dan nomor resi',
      icon: Truck,
      isCompleted: order?.status === 'FULFILLED'
    }
  ];

  const handleCopyResi = async () => {
    if (!order?.trackingNumber) return;
    try {
      await navigator.clipboard.writeText(order.trackingNumber);
      toast.success('Nomor resi berhasil disalin!');
    } catch {
      toast.error('Gagal menyalin nomor resi.');
    }
  };

  const getStageWaLink = (orderItem: Order, stage: WhatsAppMessageStage) => {
    const bankText = formatStoreBankDetails(storeBanks, storeSettings);
    const message = buildWhatsAppMessage({
      stage,
      templates: storeSettings,
      customerName: orderItem.fullName,
      orderNumber: orderItem.orderNumber,
      totalPayment: orderItem.totalPrice,
      bankDetails: bankText,
      courierName,
      trackingNumber
    });

    return `https://wa.me/${formatWaNumber(orderItem.whatsapp)}?text=${encodeURIComponent(message)}`;
  };

  const getShippingAdjustmentWaLink = (orderItem: Order, type: 'SURCHARGE' | 'REFUND_OFFER') => {
    const bankText = formatStoreBankDetails(storeBanks, storeSettings);
    const courierLine =
      courierName !== (orderItem.courierName || '')
        ? `Ekspedisi pesanan Anda kami sesuaikan menjadi ${courierName} (sebelumnya ${orderItem.courierName || 'belum dipilih'}).`
        : `Pesanan Anda akan dikirim via ${courierName || orderItem.courierName || 'ekspedisi pilihan toko'}.`;
    let message = '';
    if (type === 'SURCHARGE') {
      message = `Halo ${orderItem.fullName},\n\nUpdate pesanan #${orderItem.orderNumber} di RIO COLLECTION.\n\n${courierLine}\n\nBiaya ongkir aktual: ${formatIDR(actualShippingFee)} (sebelumnya ${formatIDR(quotedShippingFee)}).\nTerdapat KEKURANGAN ongkir sebesar ${formatIDR(shippingDifference)}.\n\nMohon konfirmasi & transfer kekurangan tersebut ke:\n${bankText}\n\nSetelah transfer, mohon kirimkan bukti pembayarannya ke WhatsApp ini. Terima kasih!`;
    } else {
      message = `Halo ${orderItem.fullName},\n\nUpdate pesanan #${orderItem.orderNumber}.\n\n${courierLine}\n\nBiaya ongkir aktual lebih murah ${formatIDR(Math.abs(shippingDifference))} dari tagihan awal (${formatIDR(quotedShippingFee)}).\n\nSilakan pilih salah satu:\n1. REFUND — kirimkan nomor rekening/e-wallet Anda, kelebihan akan kami kembalikan.\n2. IKHLAS — kelebihan ongkir dikembalikan sebagai apresiasi toko.\n\nTerima kasih banyak!`;
    }

    return `https://wa.me/${formatWaNumber(orderItem.whatsapp)}?text=${encodeURIComponent(message)}`;
  };

  if (ordersLoading) {
    return <CmsPageSkeleton variant="detail" />;
  }

  if (!order) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center text-center p-6 space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h3 className="text-xl font-bold text-foreground">Pesanan Tidak Ditemukan</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Pesanan dengan ID &quot;{id}&quot; tidak ditemukan atau telah dihapus dari sistem.
        </p>
        <Button
          onClick={() => router.push('/dashboard/orders')}
          className="rounded-xl font-bold text-xs"
        >
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
        <div className="flex items-center gap-3">
          <Link href="/dashboard/orders">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl cursor-pointer"
              title="Kembali ke Daftar Pesanan"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
              <span>Kelola Pesanan</span>
              <span>/</span>
              <span className="text-foreground font-mono font-bold">{order.orderNumber}</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap pt-0.5">
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
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {order.status === 'FULFILLED' && (
            <Button
              variant="outline"
              onClick={() => setIsInvoiceOpen(true)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-bold border-border/60 bg-card/60 shadow-2xs hover:bg-muted cursor-pointer"
            >
              <Printer className="h-4 w-4 text-primary" />
              <span>Cetak Invoice</span>
            </Button>
          )}
          <a
            href={`https://wa.me/${formatWaNumber(order.whatsapp)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <WhatsAppIcon size={16} className="h-4 w-4" />
            <span>Chat WhatsApp Customer</span>
          </a>
        </div>
      </div>

      {/* Main Content: 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (8 Cols): Ordered Items, COGS Breakdown, Proofs, and Progressive Action Flow */}
        <div className="lg:col-span-8 space-y-6">
          {/* Pre-Order Warning Banner if applicable */}
          {order.items.some((item) => item.isPreOrder) && (
            <div className="p-4 bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/25 dark:border-amber-800/30 rounded-xl text-xs leading-relaxed flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-800 dark:text-amber-300 font-bold block">
                  Pesanan Mengandung Item Pre-Order (PO)
                </strong>
                <p className="text-amber-700/80 dark:text-amber-400/80 text-[11px] mt-0.5">
                  Pesanan ini memiliki satu atau lebih kaos pre-order. Pastikan jadwal produksi
                  telah selesai sebelum melakukan pengiriman barang.
                </p>
              </div>
            </div>
          )}

          {/* Ordered Items & COGS Breakdown Card */}
          <div className="bg-card border border-border/40 rounded-xl p-6 shadow-xs space-y-5">
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-muted/15 border border-border/25 rounded-lg gap-3"
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
              {Boolean(order.discountAmount) && (
                <div className="flex justify-between text-green-700">
                  <span>Diskon Referral ({order.referralCodeSnapshot})</span>
                  <span className="font-bold">−{formatIDR(order.discountAmount ?? 0)}</span>
                </div>
              )}
              {order.referralCodeSnapshot && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Sumber Referral</span>
                  <span className="font-bold text-foreground">
                    {order.referralPartnerSnapshot} · {order.referralCodeSnapshot}
                  </span>
                </div>
              )}
              {order.referralRewardKind === 'CASH' && (
                <div className="flex justify-between text-muted-foreground">
                  <span>
                    Reward Partner (
                    {order.referralPayoutId
                      ? 'dibayar'
                      : order.status === 'FULFILLED'
                        ? 'siap dibayar'
                        : 'estimasi'}
                    )
                  </span>
                  <span className="font-bold text-foreground">
                    {formatIDR(order.referralRewardAmount ?? 0)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Ongkos Kirim ({order.courierName || 'JNE Express'})</span>
                <span className="font-bold text-foreground">
                  {formatIDR(order.shippingFee || 15000)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total Modal Produksi (HPP)</span>
                <span className="font-bold text-rose-500">-{formatIDR(order.totalCogs || 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-foreground pt-2 border-t border-border/20">
                <span>Total Tagihan Pembayaran</span>
                <span className="text-primary">{formatIDR(order.totalPrice)}</span>
              </div>
              <div className="p-3 bg-emerald-500/10 dark:bg-emerald-950/25 border border-emerald-500/20 dark:border-emerald-800/40 rounded-lg flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                <span className="flex items-center gap-1.5 text-xs">
                  <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Estimasi Net Profit (Laba Bersih)</span>
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
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
            <div className="bg-card border border-border/40 rounded-xl p-6 shadow-xs space-y-4">
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
                    <button
                      key={proof.label}
                      type="button"
                      onClick={() =>
                        setSelectedProof({
                          label: proof.label,
                          url: proof.url!,
                          desc: proof.desc
                        })
                      }
                      className="flex items-center justify-between p-3.5 bg-muted/15 border border-border/30 rounded-lg hover:bg-muted/30 transition-all group text-left cursor-pointer w-full"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-xs font-bold text-foreground truncate">
                            {proof.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{proof.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary shrink-0 ml-2 group-hover:underline">
                        <Eye className="h-3.5 w-3.5" />
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Shipping Adjustment Section */}
          {order.shippingAdjustmentStatus && order.shippingAdjustmentStatus !== 'NONE' && (
            <div className="bg-card border border-border/40 rounded-xl p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-border/20 pb-3">
                <div className="flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Status Selisih Ongkir
                  </h3>
                </div>
              </div>

              <div className="p-4 bg-muted/15 border border-border/30 rounded-lg text-xs space-y-2">
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
          {['PENDING', 'CONFIRMED', 'WAITING_PAYMENT', 'PAID', 'FULFILLED'].includes(
            order.status
          ) && (
            <div className="bg-card border border-border/40 rounded-xl p-6 shadow-xs space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Alur Pesanan
                </h3>
                <p className="text-xs text-muted-foreground">
                  Selesaikan setiap langkah secara berurutan. Tahap berikutnya terkunci sampai
                  WhatsApp dikonfirmasi telah dikirim.
                </p>
              </div>

              <Stepper
                steps={workflowSteps}
                currentStep={workflowStep}
                variant="cards"
                clickableSteps={false}
              />

              {order.status === 'PENDING' && (
                <div className="space-y-4 p-4 bg-muted/15 border border-border/30 rounded-lg">
                  <span className="text-xs font-bold text-foreground block">
                    Tahap 1: Kirim Konfirmasi Order &amp; Tagihan
                  </span>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
                    <a
                      href={getStageWaLink(order, 'ORDER')}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setOpenedWhatsApp({ orderId: order.id, stage: 'ORDER' })}
                      className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-xs font-bold bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer select-none"
                    >
                      <WhatsAppIcon size={16} className="h-4 w-4" />
                      <span>1. Buka WhatsApp Order</span>
                    </a>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await updateOrder({ id: order.id, waFollowedUp: true });
                          toast.success('Pengiriman WhatsApp order telah dikonfirmasi.');
                        } catch {
                          toast.error('Gagal menyimpan konfirmasi WhatsApp.');
                        }
                      }}
                      disabled={
                        isUpdating ||
                        order.waFollowedUp ||
                        openedWhatsApp?.orderId !== order.id ||
                        openedWhatsApp.stage !== 'ORDER'
                      }
                      className="h-10 rounded-lg text-xs font-bold"
                    >
                      2. Saya Sudah Mengirim
                    </Button>

                    <Button
                      onClick={async () => {
                        try {
                          await updateOrder({ id: order.id, status: 'WAITING_PAYMENT' });
                          toast.success('Pesanan sekarang menunggu pembayaran.');
                        } catch {
                          toast.error('Tahap belum dapat dilanjutkan.');
                        }
                      }}
                      disabled={isUpdating || !order.waFollowedUp}
                      className="h-10 rounded-lg text-xs font-bold bg-foreground text-background hover:bg-foreground/90 cursor-pointer disabled:opacity-50"
                    >
                      3. Lanjut Menunggu Pembayaran
                    </Button>
                  </div>
                </div>
              )}

              {order.status === 'CONFIRMED' && (
                <div className="space-y-3 p-4 bg-muted/15 border border-border/30 rounded-lg">
                  <span className="text-xs font-bold text-foreground block">
                    Order Lama: Normalisasi Status
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Status CONFIRMED berasal dari alur lama. Pindahkan ke Menunggu Pembayaran tanpa
                    mengirim ulang tagihan.
                  </p>
                  <div className="flex justify-end">
                    <Button
                      onClick={async () => {
                        try {
                          await updateOrder({ id: order.id, status: 'WAITING_PAYMENT' });
                          toast.success('Status lama berhasil dinormalisasi.');
                        } catch {
                          toast.error('Gagal memperbarui status');
                        }
                      }}
                      disabled={isUpdating}
                      className="h-10 rounded-lg text-xs font-bold"
                    >
                      Pindahkan ke Menunggu Pembayaran
                    </Button>
                  </div>
                </div>
              )}

              {order.status === 'WAITING_PAYMENT' && (
                <div className="space-y-4 p-4 bg-muted/15 border border-border/30 rounded-lg">
                  <span className="text-xs font-bold text-foreground block">
                    Tahap 2: Verifikasi Pembayaran
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
                  <a
                    href={getStageWaLink(order, 'REMINDER')}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700"
                  >
                    <WhatsAppIcon size={16} className="h-4 w-4" />
                    <span>Kirim reminder pembayaran (opsional)</span>
                  </a>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
                    <a
                      href={order.paymentProofUrl ? getStageWaLink(order, 'PAYMENT') : undefined}
                      target="_blank"
                      rel="noreferrer"
                      aria-disabled={!order.paymentProofUrl}
                      onClick={(event) => {
                        if (!order.paymentProofUrl) {
                          event.preventDefault();
                          toast.error('Unggah bukti pembayaran terlebih dahulu.');
                          return;
                        }
                        setOpenedWhatsApp({ orderId: order.id, stage: 'PAYMENT' });
                      }}
                      className={`inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-xs font-bold transition-colors select-none ${
                        order.paymentProofUrl
                          ? 'bg-foreground text-background hover:bg-foreground/90 cursor-pointer'
                          : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                      }`}
                    >
                      <WhatsAppIcon size={16} className="h-4 w-4" />
                      <span>1. Buka WhatsApp Pembayaran</span>
                    </a>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await updateOrder({ id: order.id, waFollowedUp: true });
                          toast.success('WhatsApp pembayaran telah dikonfirmasi.');
                        } catch {
                          toast.error('Gagal menyimpan konfirmasi WhatsApp.');
                        }
                      }}
                      disabled={
                        isUpdating ||
                        order.waFollowedUp ||
                        !order.paymentProofUrl ||
                        openedWhatsApp?.orderId !== order.id ||
                        openedWhatsApp.stage !== 'PAYMENT'
                      }
                      className="h-10 rounded-lg text-xs font-bold"
                    >
                      2. Saya Sudah Mengirim
                    </Button>

                    <Button
                      onClick={async () => {
                        try {
                          await updateOrder({ id: order.id, status: 'PAID' });
                          toast.success('Pembayaran telah diverifikasi sebagai lunas.');
                        } catch {
                          toast.error('Tahap pembayaran belum dapat diselesaikan.');
                        }
                      }}
                      disabled={isUpdating || !order.paymentProofUrl || !order.waFollowedUp}
                      className="h-10 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer disabled:opacity-50"
                    >
                      <span>3. Tandai Lunas</span>
                    </Button>
                  </div>
                </div>
              )}

              {order.status === 'PAID' && (
                <div className="space-y-4 p-4 bg-muted/15 border border-border/30 rounded-lg">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-foreground block">
                      Tahap 3: Pengiriman Paket &amp; Nomor Resi
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShippingAdjustmentWaOpened(false);
                        setShippingAdjustmentWaConfirmed(false);
                        setIsExpeditionDialogOpen(true);
                      }}
                      className="h-8 rounded-lg text-xs font-bold border-border/60 gap-1.5"
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
                      <Select
                        value={courierName}
                        disabled={isUpdating || order.waFollowedUp}
                        onValueChange={(value) => value && setCourierName(value)}
                      >
                        <SelectTrigger className="h-10 text-xs rounded-lg">
                          <SelectValue placeholder="Pilih ekspedisi aktif" />
                        </SelectTrigger>
                        <SelectContent>
                          {courierOptions.map((courier) => (
                            <SelectItem key={courier.value} value={courier.value}>
                              {courier.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">
                        Nomor Resi Pengiriman
                      </label>
                      <Input
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        disabled={isUpdating || order.waFollowedUp}
                        placeholder="Contoh: JNE1234567890"
                        className="h-10 text-xs rounded-lg font-mono font-bold"
                      />
                    </div>
                  </div>

                  {!isShippingAdjustmentResolved && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Selesaikan penyesuaian ongkir terlebih dahulu melalui tombol “Ubah Kurir /
                      Ongkir Aktual”.
                    </p>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 pt-1">
                    <a
                      href={
                        courierName.trim() && trackingNumber.trim() && isShippingAdjustmentResolved
                          ? getStageWaLink(order, 'SHIPPING')
                          : undefined
                      }
                      target="_blank"
                      rel="noreferrer"
                      aria-disabled={
                        !courierName.trim() ||
                        !trackingNumber.trim() ||
                        !isShippingAdjustmentResolved
                      }
                      onClick={(event) => {
                        if (!courierName.trim() || !trackingNumber.trim()) {
                          event.preventDefault();
                          toast.error('Pilih kurir dan isi nomor resi terlebih dahulu.');
                          return;
                        }
                        if (!isShippingAdjustmentResolved) {
                          event.preventDefault();
                          toast.error('Selesaikan penyesuaian ongkir terlebih dahulu.');
                          return;
                        }
                        setOpenedWhatsApp({ orderId: order.id, stage: 'SHIPPING' });
                      }}
                      className={`inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-xs font-bold transition-colors select-none ${
                        courierName.trim() && trackingNumber.trim() && isShippingAdjustmentResolved
                          ? 'bg-foreground text-background hover:bg-foreground/90 cursor-pointer'
                          : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                      }`}
                    >
                      <WhatsAppIcon size={16} className="h-4 w-4" />
                      <span>1. Buka WhatsApp Resi</span>
                    </a>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await updateOrder({
                            id: order.id,
                            courierName: courierName.trim(),
                            trackingNumber: trackingNumber.trim(),
                            waFollowedUp: true
                          });
                          toast.success('WhatsApp pengiriman telah dikonfirmasi.');
                        } catch {
                          toast.error('Gagal menyimpan konfirmasi pengiriman.');
                        }
                      }}
                      disabled={
                        isUpdating ||
                        order.waFollowedUp ||
                        openedWhatsApp?.orderId !== order.id ||
                        openedWhatsApp.stage !== 'SHIPPING' ||
                        !courierName.trim() ||
                        !trackingNumber.trim() ||
                        !isShippingAdjustmentResolved
                      }
                      className="h-10 rounded-lg text-xs font-bold"
                    >
                      2. Saya Sudah Mengirim
                    </Button>

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
                          toast.success(
                            `Pesanan ${order.orderNumber} berhasil dikirim (FULFILLED)!`
                          );
                        } catch {
                          toast.error('Gagal memperbarui status');
                        }
                      }}
                      disabled={
                        isUpdating ||
                        !order.waFollowedUp ||
                        !courierName.trim() ||
                        !trackingNumber.trim() ||
                        !isShippingAdjustmentResolved
                      }
                      className="h-10 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer disabled:opacity-50"
                    >
                      <span>3. Selesaikan Pengiriman</span>
                    </Button>
                  </div>
                </div>
              )}

              {order.status === 'FULFILLED' && (
                <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-primary/10 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Semua tahap selesai. Pesanan telah dikirim dan nomor resi sudah diinformasikan.
                </div>
              )}

              {/* Danger Zone Actions: Cancel or Reject */}
              {order.status !== 'FULFILLED' && (
                <div className="pt-3 border-t border-border/20 flex items-center justify-end gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCancelMode('CANCEL');
                      setIsCancelDialogOpen(true);
                    }}
                    disabled={isUpdating}
                    className="h-9 px-4 rounded-lg text-xs font-bold text-destructive hover:bg-destructive/10 border-border/40"
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
                      className="h-9 px-4 rounded-lg text-xs font-bold text-destructive hover:bg-destructive/10 border-border/40"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      <span>Tolak Pesanan (Spam)</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (4 Cols): Customer Info, Delivery Address & Tracking, Admin Notes */}
        <div className="lg:col-span-4 space-y-6">
          {/* Customer Profile Card */}
          <div className="bg-card border border-border/40 rounded-xl p-6 shadow-xs space-y-4">
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
                <div className="p-3 bg-muted/20 border border-border/25 rounded-lg space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Catatan Khusus Pembeli:
                  </span>
                  <p className="text-xs italic text-foreground">&ldquo;{order.notes}&rdquo;</p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery & Tracking Number Card */}
          <div className="bg-card border border-border/40 rounded-xl p-6 shadow-xs space-y-4">
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
                  {order.courierName || 'Belum dipilih'}
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
                  <div className="flex items-center justify-between p-2.5 bg-muted/20 border border-border/30 rounded-lg">
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
            <div className="bg-card border border-border/40 rounded-xl p-6 shadow-xs space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Catatan Internal Admin
              </h3>
              <p className="text-xs text-foreground italic p-3 bg-muted/20 border border-border/25 rounded-lg">
                &ldquo;{order.adminNotes}&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Expedition Change Dialog */}
      <Dialog open={isExpeditionDialogOpen} onOpenChange={setIsExpeditionDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/50 p-6 rounded-xl">
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
              <Select
                value={courierName}
                onValueChange={(value) => {
                  if (!value) return;
                  setCourierName(value);
                  setShippingAdjustmentWaOpened(false);
                  setShippingAdjustmentWaConfirmed(false);
                }}
              >
                <SelectTrigger className="h-10 rounded-lg text-xs bg-muted/20">
                  <SelectValue placeholder="Pilih Kurir" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {courierOptions.map((courier) => (
                    <SelectItem key={courier.value} value={courier.value}>
                      {courier.label}
                    </SelectItem>
                  ))}
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
                className="h-10 rounded-lg text-xs font-mono font-bold bg-muted/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Biaya Ongkir Aktual (Awal: {formatIDR(quotedShippingFee)})
              </label>
              <RupiahInput
                value={actualShippingFee}
                onValueChange={(value) => {
                  setActualShippingFee(value);
                  setShippingAdjustmentWaOpened(false);
                  setShippingAdjustmentWaConfirmed(false);
                }}
                className="h-10 rounded-lg text-xs bg-muted/20"
              />
            </div>

            {hasShippingDifference && (
              <div className="p-3.5 rounded-lg bg-muted/20 border border-border/30 text-xs font-semibold space-y-1">
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
              className="h-9 rounded-lg text-xs font-semibold"
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
              className="h-9 rounded-lg text-xs font-bold bg-foreground text-background hover:bg-foreground/90"
            >
              Lanjutkan Konfirmasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expedition Surcharge / Refund Confirmation Dialog */}
      <Dialog open={isExpeditionConfirmOpen} onOpenChange={setIsExpeditionConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/50 p-6 rounded-xl">
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
                  onClick={() => setShippingAdjustmentWaOpened(true)}
                  className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-xs font-bold bg-foreground text-background w-full"
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
                  <strong>{formatIDR(Math.abs(shippingDifference))}</strong>. Pilih keputusan
                  customer:
                </p>
                <a
                  href={getShippingAdjustmentWaLink(order, 'REFUND_OFFER')}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShippingAdjustmentWaOpened(true)}
                  className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-xs font-bold bg-foreground text-background w-full"
                >
                  <WhatsAppIcon size={14} className="h-3.5 w-3.5" />
                  <span>1. Kirim WA Tawaran Refund</span>
                </a>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={shippingAdjustmentChoice === 'REFUND' ? 'default' : 'outline'}
                    onClick={() => setShippingAdjustmentChoice('REFUND')}
                    className="h-9 rounded-lg text-xs font-bold"
                  >
                    Customer minta refund
                  </Button>
                  <Button
                    type="button"
                    variant={shippingAdjustmentChoice === 'WAIVE' ? 'default' : 'outline'}
                    onClick={() => setShippingAdjustmentChoice('WAIVE')}
                    className="h-9 rounded-lg text-xs font-bold"
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
                      className="text-xs rounded-lg"
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

            {hasShippingDifference && (
              <Button
                type="button"
                variant="outline"
                disabled={!shippingAdjustmentWaOpened || shippingAdjustmentWaConfirmed}
                onClick={() => {
                  setShippingAdjustmentWaConfirmed(true);
                  toast.success('Pengiriman WhatsApp penyesuaian ongkir telah dikonfirmasi.');
                }}
                className="w-full h-9 rounded-lg text-xs font-bold"
              >
                2. Saya Sudah Mengirim Update Ongkir
              </Button>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsExpeditionConfirmOpen(false)}
              className="h-9 rounded-lg text-xs font-semibold"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={
                isUpdating ||
                (shippingDifference > 0 &&
                  (!shippingAdjustmentWaConfirmed || !additionalPaymentProofUrl)) ||
                (shippingDifference < 0 &&
                  (!shippingAdjustmentWaConfirmed ||
                    !shippingAdjustmentChoice ||
                    (shippingAdjustmentChoice === 'REFUND' &&
                      (!refundReason.trim() || !refundProofUrl))))
              }
              onClick={async () => {
                try {
                  await updateOrder({
                    id: order.id,
                    courierName,
                    trackingNumber,
                    shippingFee: actualShippingFee,
                    shippingAdjustmentWaSent: hasShippingDifference,
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
              className="h-9 rounded-lg text-xs font-bold bg-foreground text-background hover:bg-foreground/90"
            >
              {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel / Reject Order Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/50 p-6 rounded-xl">
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
                className="text-xs rounded-lg min-h-20"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
              className="h-9 rounded-lg text-xs font-semibold"
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
              className="h-9 rounded-lg text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUpdating ? 'Memproses...' : 'Konfirmasi Batalkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bukti Pembayaran & Berkas Popup Modal */}
      <Dialog
        open={Boolean(selectedProof)}
        onOpenChange={(open) => !open && setSelectedProof(null)}
      >
        <DialogContent className="sm:max-w-xl max-w-lg bg-card border-border/40 rounded-xl p-5 sm:p-6 shadow-xl space-y-4">
          <DialogHeader className="space-y-1.5 border-b border-border/20 pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <DialogTitle className="text-sm font-bold text-foreground">
                  {selectedProof?.label}
                </DialogTitle>
              </div>
              {order && (
                <Badge variant="outline" className="font-mono text-[10px]">
                  #{order.orderNumber}
                </Badge>
              )}
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              {selectedProof?.desc} {order ? `• ${order.fullName}` : ''}
            </DialogDescription>
          </DialogHeader>

          {/* Image / Document Preview Container */}
          <div className="relative w-full max-h-[65vh] min-h-56 rounded-lg overflow-y-auto border border-border/30 bg-muted/20 flex items-center justify-center p-2">
            {selectedProof?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedProof.url}
                alt={selectedProof.label}
                className="max-h-[60vh] w-auto max-w-full object-contain rounded-md shadow-xs select-none"
              />
            ) : (
              <div className="text-center py-12 text-xs text-muted-foreground">
                Berkas tidak ditemukan.
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between gap-2 pt-2 border-t border-border/20">
            <a
              href={selectedProof?.url || '#'}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Buka di Tab Baru</span>
            </a>

            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedProof(null)}
              className="h-8 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice & Bluetooth Thermal Print Dialog */}
      {order && (
        <OrderInvoiceDialog order={order} open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen} />
      )}
    </div>
  );
}
