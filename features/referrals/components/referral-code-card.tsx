'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Copy, Gift, Check, Trash2, Link2, CreditCard } from 'lucide-react';
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
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
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

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code.code);
      setCopiedCode(true);
      toast.success(`Kode referral "${code.code}" berhasil disalin.`);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error('Gagal menyalin kode.');
    }
  }

  async function copyLink() {
    try {
      const shareUrl = `${window.location.origin}/?ref=${code.code}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast.success('Link referral berhasil disalin.');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error('Gagal menyalin link.');
    }
  }

  return (
    <>
      <Card className="overflow-hidden border-border/60 bg-card shadow-xs rounded-2xl">
        <CardContent className="space-y-4 p-4 sm:p-5">
          {/* Header & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3.5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Code with quick 1-click copy */}
                <button
                  type="button"
                  onClick={copyCode}
                  title="Klik untuk salin kode"
                  className="group/code inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted/70 px-2.5 py-1 transition-colors cursor-pointer"
                >
                  <span className="font-mono text-sm sm:text-base font-extrabold tracking-wider text-foreground">
                    {code.code}
                  </span>
                  {copiedCode ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover/code:text-foreground transition-colors" />
                  )}
                </button>

                {/* Status indicator */}
                {code.isActive ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                    AKTIF
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    NONAKTIF
                  </span>
                )}

                {/* Reward Type Badge */}
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                  {code.rewardKind === 'CASH' ? 'Reward Uang' : 'Reward Kaos'}
                </span>
              </div>

              {/* Benefits summary tags */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 text-[11px] font-medium border border-border/40">
                  Diskon Pembeli:{' '}
                  <strong className="text-foreground">
                    {benefitLabel(code.discountMode, code.discountValue)}
                  </strong>
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 text-[11px] font-medium border border-border/40">
                  Komisi Partner:{' '}
                  <strong className="text-foreground">
                    {code.rewardKind === 'CASH'
                      ? benefitLabel(code.rewardMode, code.rewardValue)
                      : `1 Kaos / ${code.giftEveryUnits} unit selesai`}
                  </strong>
                </span>
              </div>
            </div>

            {/* Top Actions */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyLink}
                className="h-8 gap-1.5 text-xs font-semibold rounded-lg"
                title="Salin Link Referral"
              >
                {copiedLink ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Link2 className="h-3.5 w-3.5" />
                )}
                <span>{copiedLink ? 'Tersalin' : 'Salin Link'}</span>
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
                  className="h-8 w-8 text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}

              {canManage && (
                <div className="flex items-center pl-2 border-l border-border/60">
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

          {/* Clean 3-Column Performance Metrics */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 rounded-xl bg-muted/30 p-2.5 sm:p-3 border border-border/40 text-center sm:text-left">
            <div className="space-y-0.5">
              <p className="text-[11px] font-medium text-muted-foreground">Order Lunas</p>
              <p className="text-sm sm:text-base font-extrabold text-foreground">
                {code.paidOrders}
                <span className="text-[11px] font-normal text-muted-foreground ml-1">
                  / {code.orderCount}
                </span>
              </p>
            </div>
            <div className="space-y-0.5 border-x border-border/40 px-1 sm:px-2">
              <p className="text-[11px] font-medium text-muted-foreground">Unit Terjual</p>
              <p className="text-sm sm:text-base font-extrabold text-foreground">
                {code.unitsSold}{' '}
                <span className="text-[11px] font-normal text-muted-foreground">pcs</span>
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-medium text-muted-foreground">Penjualan Neto</p>
              <p className="text-sm sm:text-base font-extrabold text-primary truncate">
                {formatIDR(code.netRevenue)}
              </p>
            </div>
          </div>

          {/* Reward Status Card - CASH */}
          {code.rewardKind === 'CASH' && (
            <div className="rounded-xl border bg-primary/5 dark:bg-primary/10 p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Reward Siap Bayar:
                    </span>
                    <span className="text-sm font-extrabold text-primary">
                      {formatIDR(code.payableCash)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Estimasi total:{' '}
                    <strong className="text-foreground">{formatIDR(code.estimatedCash)}</strong> ·
                    Sudah ditransfer:{' '}
                    <strong className="text-foreground">{formatIDR(code.paidCash)}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reward Status Card - SHIRT */}
          {code.rewardKind === 'SHIRT' && (
            <div className="space-y-3">
              <div className="rounded-xl border bg-primary/5 dark:bg-primary/10 p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Gift className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Sisa Hak Kaos:
                      </span>
                      <span className="text-sm font-extrabold text-primary">
                        {code.availableGifts} Kaos
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Total hak terkumpul:{' '}
                      <strong className="text-foreground">{code.earnedGifts}</strong> · Sudah
                      diserahkan: <strong className="text-foreground">{code.deliveredGifts}</strong>
                    </p>
                  </div>
                </div>

                {canSettle && code.availableGifts > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowClaimForm((prev) => !prev)}
                    className="h-8 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-xs"
                  >
                    {showClaimForm ? 'Tutup Form' : 'Serahkan Kaos Hadiah'}
                  </Button>
                )}
              </div>

              {canSettle &&
                code.availableGifts > 0 &&
                showClaimForm &&
                (productsLoading ? (
                  <div className="grid gap-2 border-t border-border pt-3 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <form
                    onSubmit={handleDeliverGift}
                    className="grid gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 sm:grid-cols-3 animate-in fade-in duration-200"
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
