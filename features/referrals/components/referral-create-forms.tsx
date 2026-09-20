'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormInput, FormRupiahInput, FormSelect, FormTextarea } from '@/components/shared';
import type { ReferralPartnerView } from '../types';
import { useReferralActions } from '../hooks/use-referrals';

interface Props {
  partners: ReferralPartnerView[];
}

type BenefitMode = 'PERCENTAGE' | 'NOMINAL';
type RewardKind = 'CASH' | 'SHIRT';

const benefitOptions = [
  { value: 'PERCENTAGE', label: 'Persen (%)' },
  { value: 'NOMINAL', label: 'Rupiah (Rp)' }
];

export function ReferralCreateForms({ partners }: Props) {
  const actions = useReferralActions();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [notes, setNotes] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [code, setCode] = useState('');
  const [discountMode, setDiscountMode] = useState<BenefitMode>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(10);
  const [rewardKind, setRewardKind] = useState<RewardKind>('CASH');
  const [rewardMode, setRewardMode] = useState<BenefitMode>('PERCENTAGE');
  const [rewardValue, setRewardValue] = useState(5);
  const [giftEveryUnits, setGiftEveryUnits] = useState(10);

  async function createPartner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await actions.post('partners', { name, whatsapp, notes });
      setName(''); setWhatsapp(''); setNotes('');
      toast.success('Partner berhasil dibuat.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal membuat partner.');
    } finally { setBusy(false); }
  }

  async function createCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await actions.post('codes', {
        partnerId: partnerId || partners[0]?.id,
        code,
        discountMode,
        discountValue,
        rewardKind,
        ...(rewardKind === 'CASH' ? { rewardMode, rewardValue } : { giftEveryUnits })
      });
      setCode('');
      toast.success('Kode referral berhasil dibuat.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal membuat kode.');
    } finally { setBusy(false); }
  }

  const validDiscount = discountValue > 0 && (discountMode === 'NOMINAL' || discountValue <= 100);
  const validReward = rewardKind === 'SHIRT'
    ? giftEveryUnits > 0
    : rewardValue > 0 && (rewardMode === 'NOMINAL' || rewardValue <= 100);

  return <div className="grid gap-4 lg:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle>Buat partner</CardTitle>
        <CardDescription>Partner cukup menerima kode atau link untuk dibagikan.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={createPartner} className="space-y-4">
          <FormInput id="referral-partner-name" label="Nama partner" required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} />
          <FormInput id="referral-partner-whatsapp" label="WhatsApp (opsional)" type="tel" maxLength={25} value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} />
          <FormTextarea id="referral-partner-notes" label="Catatan (opsional)" maxLength={1000} value={notes} onChange={(event) => setNotes(event.target.value)} />
          <Button type="submit" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan partner'}</Button>
        </form>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Buat kode referral</CardTitle>
        <CardDescription>Nilai diskon dan reward terkunci setelah kode dibuat.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={createCode} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormSelect id="referral-partner-select" label="Partner" value={partnerId || partners[0]?.id || ''} onValueChange={setPartnerId}
              options={partners.map((partner) => ({ value: partner.id, label: partner.name }))}
              placeholder="Buat partner dulu" disabled={busy || partners.length === 0} />
            <FormInput id="referral-code" label="Kode (4–20 huruf/angka)" required minLength={4} maxLength={20} pattern="[A-Za-z0-9]+"
              value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="MISALRIO10" />
            <FormSelect id="referral-discount-mode" label="Bentuk diskon" value={discountMode} onValueChange={(value) => setDiscountMode(value as BenefitMode)} options={benefitOptions} />
            {discountMode === 'NOMINAL'
              ? <FormRupiahInput id="referral-discount-value" label="Nilai diskon (Rp)" value={discountValue} onValueChange={setDiscountValue} required />
              : <FormInput id="referral-discount-value" label="Nilai diskon (%)" type="number" min={1} max={100} required value={discountValue} onChange={(event) => setDiscountValue(Number(event.target.value))} />}
            <FormSelect id="referral-reward-kind" label="Jenis reward" value={rewardKind} onValueChange={(value) => setRewardKind(value as RewardKind)}
              options={[{ value: 'CASH', label: 'Uang' }, { value: 'SHIRT', label: 'Kaos' }]} />
            {rewardKind === 'CASH' ? <>
              <FormSelect id="referral-reward-mode" label="Bentuk reward" value={rewardMode} onValueChange={(value) => setRewardMode(value as BenefitMode)}
                options={[{ value: 'PERCENTAGE', label: 'Persen (%)' }, { value: 'NOMINAL', label: 'Rupiah per order' }]} />
              {rewardMode === 'NOMINAL'
                ? <FormRupiahInput id="referral-reward-value" label="Nilai reward (Rp)" value={rewardValue} onValueChange={setRewardValue} required />
                : <FormInput id="referral-reward-value" label="Nilai reward (%)" type="number" min={1} max={100} required value={rewardValue} onChange={(event) => setRewardValue(Number(event.target.value))} />}
            </> : <FormInput id="referral-gift-target" label="Satu kaos setiap berapa unit terjual?" type="number" min={1} required value={giftEveryUnits}
              onChange={(event) => setGiftEveryUnits(Number(event.target.value))} />}
          </div>
          <Button type="submit" disabled={busy || !partners.length || !validDiscount || !validReward}>
            {busy ? 'Menyimpan...' : 'Simpan kode'}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>;
}
