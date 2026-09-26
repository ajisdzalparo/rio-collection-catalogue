'use client';

import React, { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { FormInput, FormRupiahInput, FormSelect, FormTextarea } from '@/components/shared';
import { useReferralActions } from '../hooks/use-referrals';
import { ReferralCodePreview } from './referral-code-preview';

interface ReferralPartnerFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

type BenefitMode = 'PERCENTAGE' | 'NOMINAL';
type RewardKind = 'CASH' | 'SHIRT';

export function ReferralPartnerForm({ onSuccess, onCancel }: ReferralPartnerFormProps) {
  const actions = useReferralActions();
  const [busy, setBusy] = useState(false);

  // Partner fields
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [notes, setNotes] = useState('');

  // Optional: create code simultaneously
  const [alsoCreateCode, setAlsoCreateCode] = useState(true);
  const [code, setCode] = useState('');
  const [discountMode, setDiscountMode] = useState<BenefitMode>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(10);
  const [rewardKind, setRewardKind] = useState<RewardKind>('CASH');
  const [rewardMode, setRewardMode] = useState<BenefitMode>('PERCENTAGE');
  const [rewardValue, setRewardValue] = useState(5);
  const [giftEveryUnits, setGiftEveryUnits] = useState(10);

  function handleNameChange(val: string) {
    setName(val);
    if (alsoCreateCode && !code) {
      const sanitized = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10);
      if (sanitized.length >= 3) {
        setCode(`${sanitized}10`);
      }
    }
  }

  const validDiscount =
    discountValue > 0 && (discountMode === 'NOMINAL' || discountValue <= 100);
  const validReward =
    rewardKind === 'SHIRT'
      ? giftEveryUnits > 0
      : rewardValue > 0 && (rewardMode === 'NOMINAL' || rewardValue <= 100);
  const validCode = !alsoCreateCode || /^[a-zA-Z0-9]{4,20}$/.test(code.trim());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      toast.error('Nama partner wajib diisi.');
      return;
    }
    if (alsoCreateCode && !validCode) {
      toast.error('Kode referral harus terdiri dari 4-20 karakter huruf atau angka.');
      return;
    }

    setBusy(true);
    try {
      const partnerRes = await actions.post<{ success: boolean; data: { id: string; name: string } }>(
        'partners',
        { name: name.trim(), whatsapp: whatsapp.trim() || undefined, notes: notes.trim() || undefined }
      );

      const createdPartnerId = partnerRes.data.id;

      if (alsoCreateCode && createdPartnerId) {
        await actions.post('codes', {
          partnerId: createdPartnerId,
          code: code.trim().toUpperCase(),
          discountMode,
          discountValue,
          rewardKind,
          ...(rewardKind === 'CASH' ? { rewardMode, rewardValue } : { giftEveryUnits })
        });
        toast.success(`Partner "${name}" & kode "${code.trim().toUpperCase()}" berhasil dibuat.`);
      } else {
        toast.success(`Partner "${name}" berhasil didaftarkan.`);
      }

      setName('');
      setWhatsapp('');
      setNotes('');
      setCode('');
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal membuat partner.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Form Controls */}
        <div className="space-y-4 lg:col-span-7">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormInput
              id="referral-partner-name"
              label="Nama Lengkap / Akun Partner"
              required
              maxLength={120}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Contoh: Budi Santoso atau @influencer_id"
              helperText="Nama asli partner atau nama panggung/sosmed"
            />

            <FormInput
              id="referral-partner-whatsapp"
              label="Nomor WhatsApp (Opsional)"
              type="tel"
              maxLength={25}
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="Contoh: 081234567890"
              helperText="Untuk konfirmasi order & pencairan komisi"
            />
          </div>

          <FormTextarea
            id="referral-partner-notes"
            label="Catatan Kerjasama (Opsional)"
            maxLength={1000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan channel promosi, perjanjian khusus, dsb."
            rows={2}
          />

          {/* Switch Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/20 p-3.5 transition-colors">
            <div className="space-y-0.5 pr-2">
              <p className="text-xs font-semibold text-foreground">Sekaligus terbitkan kode referral pertama?</p>
              <p className="text-[11px] text-muted-foreground">
                Langsung buatkan voucher diskon dan aturan komisi untuk partner ini.
              </p>
            </div>
            <Switch checked={alsoCreateCode} onCheckedChange={setAlsoCreateCode} />
          </div>

          {/* Inline Code Configuration */}
          {alsoCreateCode && (
            <div className="space-y-4 rounded-xl border border-border/70 bg-card p-4 animate-in fade-in-0 duration-200">
              <FormInput
                id="inline-referral-code"
                label="Kode Voucher Referral"
                required
                minLength={4}
                maxLength={20}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
                placeholder="Contoh: BUDI10"
                helperText="4-20 huruf atau angka tanpa spasi"
                className="font-mono tracking-wider font-semibold"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                {/* Diskon Pembeli */}
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
                  <span className="text-xs font-semibold text-foreground">Diskon Pembeli</span>
                  <FormSelect
                    id="inline-discount-mode"
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
                      id="inline-discount-value"
                      label="Nilai Potongan (Rp)"
                      value={discountValue}
                      onValueChange={setDiscountValue}
                      required
                    />
                  ) : (
                    <FormInput
                      id="inline-discount-value"
                      label="Nilai Potongan (%)"
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                    />
                  )}
                </div>

                {/* Komisi Partner */}
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
                  <span className="text-xs font-semibold text-foreground">Komisi Partner</span>
                  <FormSelect
                    id="inline-reward-kind"
                    label="Tipe Komisi"
                    value={rewardKind}
                    onValueChange={(val) => setRewardKind(val as RewardKind)}
                    options={[
                      { value: 'CASH', label: 'Uang Tunai' },
                      { value: 'SHIRT', label: 'Hadiah Kaos' }
                    ]}
                  />

                  {rewardKind === 'CASH' ? (
                    <>
                      <FormSelect
                        id="inline-reward-mode"
                        label="Kalkulasi"
                        value={rewardMode}
                        onValueChange={(val) => setRewardMode(val as BenefitMode)}
                        options={[
                          { value: 'PERCENTAGE', label: 'Persen (%) dari omzet' },
                          { value: 'NOMINAL', label: 'Nominal tetap (Rp) per order' }
                        ]}
                      />
                      {rewardMode === 'NOMINAL' ? (
                        <FormRupiahInput
                          id="inline-reward-value"
                          label="Nominal Komisi (Rp)"
                          value={rewardValue}
                          onValueChange={setRewardValue}
                          required
                        />
                      ) : (
                        <FormInput
                          id="inline-reward-value"
                          label="Persentase Komisi (%)"
                          type="number"
                          min={1}
                          max={100}
                          required
                          value={rewardValue}
                          onChange={(e) => setRewardValue(Number(e.target.value))}
                        />
                      )}
                    </>
                  ) : (
                    <FormInput
                      id="inline-gift-target"
                      label="Target Terjual per 1 Kaos"
                      type="number"
                      min={1}
                      required
                      value={giftEveryUnits}
                      onChange={(e) => setGiftEveryUnits(Number(e.target.value))}
                      helperText="Tiap akumulasi X pcs terjual"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Preview or Guide */}
        <div className="lg:col-span-5 lg:sticky lg:top-0">
          {alsoCreateCode ? (
            <ReferralCodePreview
              code={code}
              partnerName={name || 'Partner Baru'}
              discountMode={discountMode}
              discountValue={discountValue}
              rewardKind={rewardKind}
              rewardMode={rewardMode}
              rewardValue={rewardValue}
              giftEveryUnits={giftEveryUnits}
            />
          ) : (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-5 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Informasi Pendaftaran Partner
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Partner yang didaftarkan akan tersimpan di sistem. Anda dapat menerbitkan kode voucher referral untuk partner ini kapan saja melalui tab <strong>Kode Referral</strong>.
              </p>
              <div className="rounded-lg bg-card p-3 border border-border/50 text-xs text-muted-foreground space-y-1.5">
                <p className="font-medium text-foreground">Kapan kode referral dibuat?</p>
                <p>Aktifkan tombol switch di sebelah kiri jika Anda ingin langsung menetapkan kode promo dan komisi sekarang juga.</p>
              </div>
            </div>
          )}
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
          disabled={busy || !name.trim() || (alsoCreateCode && (!code.trim() || !validDiscount || !validReward))}
          className="font-semibold"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          <span>
            {busy
              ? 'Menyimpan...'
              : alsoCreateCode
              ? 'Simpan Partner & Terbitkan Kode'
              : 'Simpan Partner'}
          </span>
        </Button>
      </div>
    </form>
  );
}
