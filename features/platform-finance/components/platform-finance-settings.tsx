'use client';

import { useState, type FormEvent } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RupiahInput } from '@/components/ui/rupiah-input';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { formatIDR } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { CommissionMode, PlatformFinanceSettings } from '../types';
import type { PlatformFinanceSettingsPayload } from '../hooks/use-platform-finance';

interface PlatformFinanceSettingsProps {
  settings: PlatformFinanceSettings;
  onSave: (payload: PlatformFinanceSettingsPayload) => Promise<unknown>;
  isSaving: boolean;
}

function formatCommission(mode: CommissionMode, value: number) {
  return mode === 'PERCENTAGE'
    ? `${value}% dari subtotal produk`
    : `${formatIDR(value)} per transaksi`;
}

export function PlatformFinanceSettingsForm({
  settings,
  onSave,
  isSaving
}: PlatformFinanceSettingsProps) {
  const [commissionMode, setCommissionMode] = useState<CommissionMode>(settings.commissionMode);
  const [commissionValue, setCommissionValue] = useState(settings.commissionValue);
  const [isEditing, setIsEditing] = useState(false);
  const [pendingSettings, setPendingSettings] =
    useState<PlatformFinanceSettingsPayload | null>(null);
  const isUnchanged =
    commissionMode === settings.commissionMode && commissionValue === settings.commissionValue;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isEditing || isUnchanged) return;
    setPendingSettings({
      commissionMode,
      commissionValue:
        commissionMode === 'PERCENTAGE'
          ? Math.min(100, Math.max(0, commissionValue))
          : Math.max(0, commissionValue)
    });
  };

  const handleConfirmSave = async () => {
    if (!pendingSettings) return;
    try {
      await onSave(pendingSettings);
      setPendingSettings(null);
      setIsEditing(false);
    } catch {
      // Error feedback is handled by the parent; keep the confirmation open for retry.
    }
  };

  const handleCancelEdit = () => {
    setCommissionMode(settings.commissionMode);
    setCommissionValue(settings.commissionValue);
    setPendingSettings(null);
    setIsEditing(false);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
      >
        <div className="space-y-1.5">
          <label
            htmlFor="commission-mode"
            className="flex h-4 items-center text-xs font-bold text-foreground"
          >
            Mode komisi
          </label>
          <Select
            value={commissionMode}
            onValueChange={(value) => setCommissionMode(value as CommissionMode)}
            disabled={!isEditing || isSaving}
          >
            <SelectTrigger id="commission-mode" className="h-10">
              <SelectValue placeholder="Pilih mode komisi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENTAGE">Persentase penjualan</SelectItem>
              <SelectItem value="NOMINAL">Nominal per transaksi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="commission-value"
            className="flex h-4 items-center text-xs font-bold text-foreground"
          >
            Nilai komisi {commissionMode === 'PERCENTAGE' ? '(%)' : '(Rp)'}
          </label>
          {commissionMode === 'NOMINAL' ? (
            <RupiahInput
              id="commission-value"
              value={commissionValue}
              onValueChange={setCommissionValue}
              disabled={!isEditing || isSaving}
            />
          ) : (
            <Input
              id="commission-value"
              type="number"
              min="0"
              max="100"
              step="1"
              value={commissionValue}
              disabled={!isEditing || isSaving}
              onChange={(event) => setCommissionValue(Number(event.target.value) || 0)}
              placeholder="Contoh: 20"
            />
          )}
          <p className="text-[11px] leading-4 text-muted-foreground">
            {commissionMode === 'PERCENTAGE'
              ? 'Contoh: 20 berarti komisi 20% dari subtotal produk.'
              : 'Contoh: Rp50.000 berarti komisi tetap untuk setiap transaksi.'}
          </p>
        </div>

        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <span aria-hidden="true" className="invisible hidden h-4 items-center text-xs sm:flex">
            Aksi
          </span>
          {isEditing ? (
            <div className="flex gap-2 lg:min-w-72">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={handleCancelEdit}
                className="h-10 flex-1 rounded-lg"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSaving || isUnchanged}
                className="h-10 flex-1 rounded-lg"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="h-10 w-full gap-2 rounded-lg lg:min-w-44"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Pengaturan
            </Button>
          )}
        </div>
      </form>

      <ConfirmModal
        open={pendingSettings !== null}
        onOpenChange={(open) => {
          if (!open && !isSaving) setPendingSettings(null);
        }}
        title="Simpan Perubahan Komisi?"
        description={
          pendingSettings
            ? `Komisi akan diubah dari ${formatCommission(settings.commissionMode, settings.commissionValue)} menjadi ${formatCommission(pendingSettings.commissionMode, pendingSettings.commissionValue)}. Rate baru hanya berlaku untuk transaksi yang baru masuk status PAID.`
            : ''
        }
        confirmText="Simpan Perubahan"
        variant="default"
        onConfirm={() => void handleConfirmSave()}
        loading={isSaving}
      />
    </>
  );
}
