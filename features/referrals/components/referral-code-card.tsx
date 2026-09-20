'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Copy, Gift, Check, Trash2 } from 'lucide-react';
import { formatIDR } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { FormInput, FormSelect, FormTextarea } from '@/components/shared';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import type { Product } from '@/types/catalogue.types';
import type { ReferralCodeView } from '../types';
import { useReferralActions } from '../hooks/use-referrals';

interface ReferralCodeCardProps {
  code: ReferralCodeView;
  products: Product[];
  productsLoading: boolean;
  canManage: boolean;
  canSettle: boolean;
}

function benefitLabel(mode: string | null, value: number | null) {
  if (value === null) return '—';
  return mode === 'PERCENTAGE' ? `${value}%` : formatIDR(value);
}

export function ReferralCodeCard({
  code,
  products,
  productsLoading,
  canManage,
  canSettle
}: ReferralCodeCardProps) {
  const actions = useReferralActions();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productId, setProductId] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  const canDeleteCode = canManage && code.orderCount === 0 && code.gifts.length === 0;

  const giftProducts = products.filter(
    (product) =>
      product.stockMode === 'QUANTITY' &&
      !product.deletedAt &&
      product.variants.some((variant) => variant.inStock && (variant.stock ?? 0) > 0)
  );
  const product = giftProducts.find((item) => item.id === productId) ?? giftProducts[0];
  const variants =
    product?.variants.filter((variant) => variant.inStock && (variant.stock ?? 0) > 0) ?? [];
  const selectedSize =
    variants.find((variant) => variant.size === size)?.size ?? variants[0]?.size ?? '';

  async function handleToggle() {
    setBusy(true);
    try {
      await actions.toggleCode(code.id, !code.isActive);
      toast.success(code.isActive ? 'Kode dinonaktifkan.' : 'Kode diaktifkan.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengubah status kode.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteCode() {
    setBusy(true);
    try {
      await actions.deleteCode(code.id);
      setShowDeleteModal(false);
      toast.success(`Kode referral ${code.code} berhasil dihapus.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus kode.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeliverGift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product || !selectedSize) return;
    setBusy(true);
    try {
      await actions.post('gifts', {
        codeId: code.id,
        productId: product.id,
        size: selectedSize,
        quantity,
        note
      });
      setQuantity(1);
      setNote('');
      toast.success('Hadiah berhasil dicatat dan stok otomatis berkurang.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mencatat hadiah.');
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      const shareUrl = `${window.location.origin}/?ref=${code.code}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link referral berhasil disalin.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin link.');
    }
  }

  return (
    <>
      <Card className="overflow-hidden border-border/70 bg-card/60 shadow-xs">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-extrabold tracking-wider text-foreground">
                  {code.code}
                </span>
                <Badge
                  variant="outline"
                  className={
                    code.isActive
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold'
                      : 'bg-muted text-muted-foreground text-[10px]'
                  }
                >
                  {code.isActive ? 'AKTIF' : 'NONAKTIF'}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {code.rewardKind === 'CASH' ? 'Reward Uang' : 'Reward Kaos'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Diskon Pembeli:{' '}
                <strong className="text-foreground">
                  {benefitLabel(code.discountMode, code.discountValue)}
                </strong>
                {' · '}
                Komisi Partner:{' '}
                <strong className="text-foreground">
                  {code.rewardKind === 'CASH'
                    ? benefitLabel(code.rewardMode, code.rewardValue)
                    : `1 Kaos / ${code.giftEveryUnits} unit selesai`}
                </strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyLink}
                className="h-8 gap-1.5 text-xs font-semibold"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copied ? 'Tersalin' : 'Salin Link'}</span>
              </Button>

              {canDeleteCode && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={busy}
                  aria-label={`Hapus kode ${code.code}`}
                  title="Hapus kode (belum digunakan)"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}

              {canManage && (
                <div className="flex items-center gap-1.5 pl-2 border-l border-border">
                  <Switch
                    checked={code.isActive}
                    disabled={busy}
                    onCheckedChange={handleToggle}
                    aria-label={`Ubah status ${code.code}`}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 rounded-lg bg-muted/40 p-2.5 text-xs sm:grid-cols-4">
            <div>
              <p className="text-[11px] text-muted-foreground">Order Masuk / Lunas</p>
              <p className="text-sm font-bold text-foreground">
                {code.orderCount} <span className="text-muted-foreground font-normal">/</span>{' '}
                {code.paidOrders}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Unit Terjual</p>
              <p className="text-sm font-bold text-foreground">{code.unitsSold} pcs</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Penjualan Neto</p>
              <p className="text-sm font-bold text-foreground">{formatIDR(code.netRevenue)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">
                {code.rewardKind === 'CASH' ? 'Reward Siap Bayar' : 'Hak Kaos Tersedia'}
              </p>
              <p className="text-sm font-bold text-primary">
                {code.rewardKind === 'CASH'
                  ? formatIDR(code.payableCash)
                  : `${code.availableGifts} pcs`}
              </p>
            </div>
          </div>

          {code.rewardKind === 'CASH' && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                Estimasi Komisi Total:{' '}
                <strong className="text-foreground">{formatIDR(code.estimatedCash)}</strong>
              </span>
              <span>
                Sudah Ditransfer:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {formatIDR(code.paidCash)}
                </strong>
              </span>
            </div>
          )}

          {code.rewardKind === 'SHIRT' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Total Hak Terkumpul:{' '}
                  <strong className="text-foreground">{code.earnedGifts} kaos</strong>
                </span>
                <span>
                  Sudah Diserahkan:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {code.deliveredGifts} kaos
                  </strong>
                </span>
                <span>
                  Sisa Klaim: <strong className="text-primary">{code.availableGifts} kaos</strong>
                </span>
              </div>

              {canSettle &&
                code.availableGifts > 0 &&
                (productsLoading ? (
                  <div className="grid gap-2 border-t border-border pt-3 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <form
                    onSubmit={handleDeliverGift}
                    className="grid gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 sm:grid-cols-3"
                  >
                    <div className="sm:col-span-3 flex items-center gap-2 text-xs font-bold text-foreground">
                      <Gift className="h-4 w-4 text-primary" />
                      <span>Klaim / Serahkan Hadiah Kaos ke Partner</span>
                    </div>
                    <FormSelect
                      id={`gift-product-${code.id}`}
                      label="Pilih Kaos"
                      value={product?.id ?? ''}
                      onValueChange={(val) => {
                        setProductId(val);
                        setSize('');
                      }}
                      options={giftProducts.map((item) => ({ value: item.id, label: item.name }))}
                      placeholder="Pilih produk"
                      disabled={!giftProducts.length}
                    />
                    <FormSelect
                      id={`gift-size-${code.id}`}
                      label="Pilih Ukuran"
                      value={selectedSize}
                      onValueChange={setSize}
                      options={variants.map((v) => ({
                        value: v.size,
                        label: `${v.size} (Stok: ${v.stock})`
                      }))}
                      placeholder="Pilih ukuran"
                      disabled={!variants.length}
                    />
                    <FormInput
                      id={`gift-quantity-${code.id}`}
                      label="Jumlah"
                      type="number"
                      min={1}
                      max={code.availableGifts}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      required
                    />
                    <div className="sm:col-span-3">
                      <FormTextarea
                        id={`gift-note-${code.id}`}
                        label="Catatan Penyerahan (Opsional)"
                        maxLength={1000}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Misal: Diambil langsung oleh partner di studio"
                        className="min-h-14"
                      />
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={
                        busy ||
                        !product ||
                        !selectedSize ||
                        quantity < 1 ||
                        quantity > code.availableGifts
                      }
                      className="sm:col-span-3 sm:justify-self-start"
                    >
                      {busy ? 'Mencatat...' : `Serahkan ${quantity} Kaos Hadiah`}
                    </Button>
                  </form>
                ))}

              {code.gifts.length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground">
                    Riwayat Penyerahan Hadiah ({code.gifts.length})
                  </summary>
                  <ul className="mt-2 space-y-1.5 rounded-lg border border-border bg-background p-2.5">
                    {code.gifts.map((g) => (
                      <li
                        key={g.id}
                        className="flex flex-wrap items-center justify-between gap-1 text-[11px]"
                      >
                        <span>
                          {new Date(g.deliveredAt).toLocaleDateString('id-ID')} ·{' '}
                          <strong>
                            {g.quantity}× {g.productName} ({g.size})
                          </strong>
                          {g.note ? ` (${g.note})` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          {code.orders.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground">
                Lihat Riwayat Pesanan ({code.orders.length})
              </summary>
              <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border bg-background p-2">
                {code.orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 py-1.5 last:border-none text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <Link
                        className="font-mono font-bold text-primary hover:underline"
                        href={`/dashboard/orders/${order.id}`}
                      >
                        {order.orderNumber}
                      </Link>
                      <span>· {order.fullName}</span>
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                        {order.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>{order.units} unit</span>
                      <span className="font-semibold text-foreground">
                        {formatIDR(order.netProducts)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </CardContent>
      </Card>

      <ConfirmModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Hapus Kode Referral"
        description={`Apakah Anda yakin ingin menghapus kode referral "${code.code}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Kode"
        cancelText="Batal"
        variant="destructive"
        loading={busy}
        onConfirm={handleDeleteCode}
      />
    </>
  );
}
