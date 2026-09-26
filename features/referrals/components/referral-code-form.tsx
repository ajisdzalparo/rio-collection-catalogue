'use client';

import React, { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormInput, FormRupiahInput, FormSelect } from '@/components/shared';
import type { ReferralPartnerOption } from '../types';
import { useReferralActions } from '../hooks/use-referrals';
import { ReferralCodePreview } from './referral-code-preview';

interface ReferralCodeFormProps {
  partners: ReferralPartnerOption[];
  defaultPartnerId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type BenefitMode = 'PERCENTAGE' | 'NOMINAL';
type RewardKind = 'CASH' | 'SHIRT';

export function ReferralCodeForm({
  partners,
  defaultPartnerId,
  onSuccess,
  onCancel
}: ReferralCodeFormProps) {
  const actions = useReferralActions();
  const [busy, setBusy] = useState(false);
  const [partnerId, setPartnerId] = useState(defaultPartnerId || partners[0]?.id || '');
  const [code, setCode] = useState('');
  const [discountMode, setDiscountMode] = useState<BenefitMode>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(10);
  const [rewardKind, setRewardKind] = useState<RewardKind>('CASH');
  const [rewardMode, setRewardMode] = useState<BenefitMode>('PERCENTAGE');
  const [rewardValue, setRewardValue] = useState(5);
  const [giftEveryUnits, setGiftEveryUnits] = useState(10);

  const selectedPartner = partners.find((p) => p.id === (partnerId || partners[0]?.id));

  const validDiscount =
    discountValue > 0 && (discountMode === 'NOMINAL' || discountValue <= 100);
  const validReward =
    rewardKind === 'SHIRT'
      ? giftEveryUnits > 0
      : rewardValue > 0 && (rewardMode === 'NOMINAL' || rewardValue <= 100);
  const validCode = /^[a-zA-Z0-9]{4,20}$/.test(code.trim());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validCode) {
      toast.error('Kode harus terdiri dari 4-20 karakter huruf atau angka tanpa spasi.');
      return;
    }
    setBusy(true);
    try {
      await actions.post('codes', {
        partnerId: partnerId || partners[0]?.id,
        code: code.trim().toUpperCase(),
        discountMode,
        discountValue,
        rewardKind,
        ...(rewardKind === 'CASH' ? { rewardMode, rewardValue } : { giftEveryUnits })
      });
      setCode('');
      toast.success(`Kode referral "${code.trim().toUpperCase()}" berhasil diterbitkan.`);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal membuat kode referral.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Form Controls */}
        <div className="space-y-4 lg:col-span-7">
          {/* Step 1: Partner & Code */}
          <div className="grid gap-3 sm:grid-cols-2">
            <FormSelect
              id="referral-partner-select"
              label="Pilih Partner"
              value={partnerId || partners[0]?.id || ''}
              onValueChange={setPartnerId}
              options={partners.map((partner) => ({ value: partner.id, label: partner.name }))}
              placeholder="Pilih partner tujuan"
              disabled={busy || partners.length === 0}
            />

            <FormInput
              id="referral-code"
              label="Kode Kupon Promo (4–20 Karakter)"
              required
              minLength={4}
              maxLength={20}
              pattern="[A-Za-z0-9]+"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
              placeholder="Contoh: RIOHEMAT10"
              helperText="Otomatis huruf besar, tanpa spasi"
              className="font-mono tracking-wider font-semibold"
            />
          </div>

          {/* Step 2: Buyer Discount Section */}
          <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3">
            <div>
              <h3 className="text-xs font-semibold text-foreground">Diskon Pembeli</h3>
              <p className="text-[11px] text-muted-foreground">Potongan harga yang didapat pembeli saat checkout</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormSelect
                id="referral-discount-mode"
                label="Bentuk Potongan"
                value={discountMode}
                onValueChange={(val) => setDiscountMode(val as BenefitMode)}
                options={[
                  { value: 'PERCENTAGE', label: 'Persen (%)' },
                  { value: 'NOMINAL', label: 'Nominal Tetap (Rp)' }
                ]}
              />

              {discountMode === 'NOMINAL' ? (
                <FormRupiahInput
                  id="referral-discount-value"
                  label="Nilai Potongan (Rp)"
                  value={discountValue}
                  onValueChange={setDiscountValue}
                  required
                />
              ) : (
                <FormInput
                  id="referral-discount-value"
                  label="Nilai Potongan (%)"
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  helperText="Maksimal 100%"
                />
              )}
            </div>
          </div>

          {/* Step 3: Partner Reward Section */}
          <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3">
            <div>
              <h3 className="text-xs font-semibold text-foreground">Komisi Partner</h3>
              <p className="text-[11px] text-muted-foreground">Hak bagi hasil partner saat pesanan berstatus lunas</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormSelect
                id="referral-reward-kind"
                label="Tipe Komisi"
                value={rewardKind}
                onValueChange={(val) => setRewardKind(val as RewardKind)}
                options={[
                  { value: 'CASH', label: 'Uang Tunai' },
                  { value: 'SHIRT', label: 'Hadiah Kaos' }
                ]}
              />

              {rewardKind === 'CASH' ? (
                <FormSelect
                  id="referral-reward-mode"
                  label="Kalkulasi Komisi Tunai"
                  value={rewardMode}
                  onValueChange={(val) => setRewardMode(val as BenefitMode)}
                  options={[
                    { value: 'PERCENTAGE', label: 'Persen (%) dari omzet' },
                    { value: 'NOMINAL', label: 'Nominal tetap (Rp) per order' }
                  ]}
                />
              ) : (
                <FormInput
                  id="referral-gift-target"
                  label="Target Penjualan per 1 Kaos"
                  type="number"
                  min={1}
                  required
                  value={giftEveryUnits}
                  onChange={(e) => setGiftEveryUnits(Number(e.target.value))}
                  helperText="Setiap akumulasi X unit kaos terjual"
                />
              )}

              {rewardKind === 'CASH' && (
                <div className="sm:col-span-2">
                  {rewardMode === 'NOMINAL' ? (
                    <FormRupiahInput
                      id="referral-reward-value"
                      label="Nominal Komisi (Rp) per Order"
                      value={rewardValue}
                      onValueChange={setRewardValue}
                      required
                    />
                  ) : (
                    <FormInput
                      id="referral-reward-value"
                      label="Persentase Komisi (%) dari Omzet Neto"
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={rewardValue}
                      onChange={(e) => setRewardValue(Number(e.target.value))}
                      helperText="Maksimal 100%"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-0">
          <ReferralCodePreview
            code={code}
            partnerName={selectedPartner?.name || ''}
            discountMode={discountMode}
            discountValue={discountValue}
            rewardKind={rewardKind}
            rewardMode={rewardMode}
            rewardValue={rewardValue}
            giftEveryUnits={giftEveryUnits}
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-border/50">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            Batal
          </Button>
        )}
        <Button
          type="submit"
          disabled={busy || !partners.length || !validDiscount || !validReward || !code.trim()}
          className="font-semibold"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          <span>{busy ? 'Menerbitkan...' : 'Terbitkan Kode Referral'}</span>
        </Button>
      </div>
    </form>
  );
}
