'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { CheckCircle2, CreditCard, History } from 'lucide-react';
import { formatIDR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormInput } from '@/components/shared';
import type { ReferralPartnerView } from '../types';
import { useReferralActions } from '../hooks/use-referrals';

interface ReferralPayoutSectionProps {
  partner: ReferralPartnerView;
  canSettle: boolean;
}

export function ReferralPayoutSection({ partner, canSettle }: ReferralPayoutSectionProps) {
  const actions = useReferralActions();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const payable = partner.codes.flatMap((code) =>
    code.rewardKind === 'CASH'
      ? code.orders
          .filter((order) => order.status === 'FULFILLED' && !order.referralPayoutId && order.referralRewardAmount > 0)
          .map((order) => ({ ...order, code: code.code }))
      : []
  );

  const selectedAmount = payable
    .filter((order) => selectedIds.includes(order.id))
    .reduce((sum, order) => sum + order.referralRewardAmount, 0);

  function toggleOrder(id: string) {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((val) => val !== id) : [...ids, id]));
  }

  function handleSelectAll() {
    if (selectedIds.length === payable.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(payable.map((order) => order.id));
    }
  }

  async function handlePay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedIds.length) return;
    setBusy(true);
    try {
      await actions.post('payouts', { partnerId: partner.id, orderIds: selectedIds, note });
      setSelectedIds([]);
      setNote('');
      toast.success('Pembayaran reward berhasil dicatat.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mencatat pembayaran.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {canSettle && payable.length > 0 ? (
        <form onSubmit={handlePay} className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <CreditCard className="h-4 w-4 text-primary" />
                Catat Pembayaran Reward Tunai
              </h4>
              <p className="text-xs text-muted-foreground">
                Pilih pesanan yang komisi reward-nya sudah Anda transfer ke partner.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleSelectAll} className="h-7 text-xs">
              {selectedIds.length === payable.length ? 'Batal Semua' : 'Pilih Semua'}
            </Button>
          </div>

          <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border border-border bg-background p-2">
            {payable.map((order) => (
              <label
                key={order.id}
                htmlFor={`payout-${order.id}`}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-md border border-border/50 p-2 text-xs transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Checkbox
                    id={`payout-${order.id}`}
                    checked={selectedIds.includes(order.id)}
                    onCheckedChange={() => toggleOrder(order.id)}
                    aria-label={`Pilih reward order ${order.orderNumber}`}
                  />
                  <div className="truncate">
                    <span className="font-mono font-bold text-primary">{order.orderNumber}</span>
                    <span className="text-muted-foreground"> · Kode: {order.code} · {order.fullName}</span>
                  </div>
                </div>
                <strong className="shrink-0 text-foreground">{formatIDR(order.referralRewardAmount)}</strong>
              </label>
            ))}
          </div>

          <FormInput
            id={`payout-note-${partner.id}`}
            label="Catatan Pembayaran (Opsional)"
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Misal: Transfer BCA a/n Partner, Ref: #12345"
          />

          <Button
            type="submit"
            disabled={busy || selectedIds.length === 0}
            className="w-full sm:w-auto"
          >
            {busy ? 'Mencatat...' : `Catat Pembayaran (${formatIDR(selectedAmount)})`}
          </Button>
        </form>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <span>Tidak ada komisi tunai tertunda yang perlu dibayarkan untuk partner ini saat ini.</span>
        </div>
      )}

      {partner.payouts.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <History className="h-3.5 w-3.5" />
            Riwayat Pembayaran Reward ({partner.payouts.length})
          </h4>
          <div className="divide-y divide-border/60 rounded-xl border border-border bg-card">
            {partner.payouts.map((payout) => (
              <div key={payout.id} className="p-3 text-xs">
                <div className="flex items-center justify-between font-semibold text-foreground">
                  <span>{new Date(payout.paidAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatIDR(payout.amount)}
                  </span>
                </div>
                <p className="mt-0.5 text-muted-foreground">
                  {payout.orders.length} order dilunasi
                  {payout.note ? ` · ${payout.note}` : ''}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {payout.orders.map((o) => (
                    <Link
                      key={o.id}
                      href={`/dashboard/orders/${o.id}`}
                      className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-primary hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
