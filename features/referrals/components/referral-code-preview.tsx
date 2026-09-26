import React from 'react';
import { formatIDR } from '@/lib/utils';

interface ReferralCodePreviewProps {
  code: string;
  partnerName: string;
  discountMode: 'PERCENTAGE' | 'NOMINAL';
  discountValue: number;
  rewardKind: 'CASH' | 'SHIRT';
  rewardMode: 'PERCENTAGE' | 'NOMINAL';
  rewardValue: number;
  giftEveryUnits: number;
}

export function ReferralCodePreview({
  code,
  partnerName,
  discountMode,
  discountValue,
  rewardKind,
  rewardMode,
  rewardValue,
  giftEveryUnits
}: ReferralCodePreviewProps) {
  const sampleOrderTotal = 200000;
  const sampleUnits = 2;

  const sampleDiscount =
    discountMode === 'PERCENTAGE'
      ? Math.min(sampleOrderTotal, (sampleOrderTotal * (discountValue || 0)) / 100)
      : Math.min(sampleOrderTotal, discountValue || 0);

  const sampleNetCustomer = Math.max(0, sampleOrderTotal - sampleDiscount);

  const sampleRewardCash =
    rewardKind === 'CASH'
      ? rewardMode === 'PERCENTAGE'
        ? (sampleNetCustomer * (rewardValue || 0)) / 100
        : rewardValue || 0
      : 0;

  const displayCode = code.trim() ? code.trim().toUpperCase() : 'CONTOH10';

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card p-4 sm:p-5 transition-all">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div>
          <p className="text-xs font-semibold text-foreground">Ringkasan Aturan Referral</p>
          <p className="text-[11px] text-muted-foreground">
            Partner: <span className="font-medium text-foreground">{partnerName || 'Belum dipilih'}</span>
          </p>
        </div>

        {/* Voucher Tag Style */}
        <div className="rounded-md border border-border bg-muted/50 px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-foreground">
          {displayCode}
        </div>
      </div>

      {/* Main Benefits Grid */}
      <div className="grid gap-3 pt-3 sm:grid-cols-2">
        {/* Buyer Benefit */}
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Diskon Pembeli
          </span>
          <p className="mt-1 text-base font-bold text-foreground">
            {discountMode === 'PERCENTAGE' ? `${discountValue || 0}% OFF` : `${formatIDR(discountValue || 0)} OFF`}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {discountMode === 'PERCENTAGE'
              ? 'Potongan langsung dari total belanja saat checkout.'
              : 'Potongan harga tetap untuk setiap pesanan.'}
          </p>
        </div>

        {/* Partner Commission */}
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Komisi Partner
          </span>
          <p className="mt-1 text-base font-bold text-foreground">
            {rewardKind === 'CASH'
              ? rewardMode === 'PERCENTAGE'
                ? `${rewardValue || 0}% Komisi`
                : `${formatIDR(rewardValue || 0)} / Order`
              : `1 Kaos / ${giftEveryUnits || 1} pcs`}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {rewardKind === 'CASH'
              ? rewardMode === 'PERCENTAGE'
                ? 'Dihitung dari nilai penjualan neto setelah diskon.'
                : 'Komisi tunai tetap untuk setiap pesanan lunas.'
              : `Partner berhak klaim 1 kaos gratis tiap kelipatan ${giftEveryUnits || 1} baju terjual.`}
          </p>
        </div>
      </div>

      {/* Interactive Simulation Footer */}
      <div className="mt-3 rounded-lg border border-border/40 bg-muted/30 p-2.5 text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground">Simulasi Transaksi: </span>
        Jika pelanggan berbelanja senilai {formatIDR(sampleOrderTotal)} ({sampleUnits} baju):
        <ul className="mt-1 space-y-0.5 list-disc list-inside">
          <li>
            Pelanggan hemat {formatIDR(sampleDiscount)} (Bayar: {formatIDR(sampleNetCustomer)})
          </li>
          <li>
            {rewardKind === 'CASH' ? (
              <>Partner menerima komisi {formatIDR(sampleRewardCash)}</>
            ) : (
              <>
                Partner mendapat progres {sampleUnits}/{giftEveryUnits || 10} unit menuju reward kaos gratis
              </>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
}
