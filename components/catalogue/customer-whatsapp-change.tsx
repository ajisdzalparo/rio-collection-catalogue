'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, Mail, Pencil, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { Customer } from '@/lib/customer-store';
import {
  useRequestWhatsappChangeOtp,
  useUpdateCustomerWhatsapp
} from '@/hooks/use-customer-account';

interface CustomerWhatsappChangeProps {
  customer: Customer;
}

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const visible = name.slice(0, Math.min(3, name.length));
  return `${visible}${'*'.repeat(Math.max(3, name.length - visible.length))}@${domain}`;
}

export function CustomerWhatsappChange({ customer }: CustomerWhatsappChangeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [whatsapp, setWhatsapp] = useState(customer.whatsapp || '');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const requestOtp = useRequestWhatsappChangeOtp();
  const updateWhatsapp = useUpdateCustomerWhatsapp();

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setInterval(() => setCountdown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  const reset = () => {
    setWhatsapp(customer.whatsapp || '');
    setOtpCode('');
    setOtpSent(false);
    setCountdown(0);
    setIsEditing(false);
  };

  const handleRequestOtp = async () => {
    try {
      const result = await requestOtp.mutateAsync({ whatsapp });
      setOtpSent(true);
      setOtpCode('');
      setCountdown(60);
      toast.success(result.message || `Kode OTP dikirim ke ${maskEmail(customer.email)}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengirim kode OTP.');
    }
  };

  const handleConfirm = async () => {
    try {
      await updateWhatsapp.mutateAsync({ whatsapp, otpCode });
      toast.success('Nomor WhatsApp berhasil diperbarui.');
      setOtpSent(false);
      setOtpCode('');
      setIsEditing(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memperbarui nomor WhatsApp.');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor="customer-whatsapp"
          className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface)"
        >
          Nomor WhatsApp
        </label>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 font-hanken text-[11px] font-semibold text-(--cat-on-surface) underline underline-offset-4 cursor-pointer"
          >
            <Pencil size={12} /> Ganti Nomor
          </button>
        )}
      </div>

      <input
        id="customer-whatsapp"
        type="tel"
        value={whatsapp}
        onChange={(event) => {
          setWhatsapp(event.target.value);
          setOtpSent(false);
          setOtpCode('');
        }}
        readOnly={!isEditing || otpSent}
        placeholder="081234567890"
        className="w-full h-11 px-3 font-hanken text-[14px] bg-(--cat-surface) border border-(--cat-stone) focus:border-(--cat-charcoal) focus:outline-none transition-colors read-only:bg-(--cat-surface-container) read-only:text-(--cat-on-surface-variant)"
      />

      {!isEditing ? (
        <p className="font-hanken text-[11px] text-(--cat-on-surface-variant)">
          Nomor ini digunakan untuk konfirmasi dan pembaruan pesanan.
        </p>
      ) : (
        <div className="space-y-3 border-l-2 border-(--cat-stone) pl-3">
          <p className="font-hanken text-[11px] leading-relaxed text-(--cat-on-surface-variant)">
            Demi keamanan akun, kode verifikasi akan dikirim ke {maskEmail(customer.email)}.
          </p>

          {otpSent && (
            <div className="space-y-1.5">
              <label
                htmlFor="whatsapp-change-otp"
                className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface)"
              >
                Kode OTP Email
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-(--cat-on-surface-variant)"
                />
                <input
                  id="whatsapp-change-otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6 digit kode OTP"
                  className="w-full h-11 pl-9 pr-3 font-mono text-[14px] tracking-[0.2em] bg-(--cat-surface) border border-(--cat-stone) focus:border-(--cat-charcoal) focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {!otpSent ? (
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={requestOtp.isPending || whatsapp.trim().length < 9}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-(--cat-charcoal) text-white font-hanken text-[11px] font-semibold uppercase tracking-[0.06em] disabled:opacity-60 cursor-pointer"
              >
                {requestOtp.isPending && <Loader2 size={13} className="animate-spin" />}
                Kirim OTP Email
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={updateWhatsapp.isPending || otpCode.length !== 6}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-(--cat-charcoal) text-white font-hanken text-[11px] font-semibold uppercase tracking-[0.06em] disabled:opacity-60 cursor-pointer"
                >
                  {updateWhatsapp.isPending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Check size={13} />
                  )}
                  Verifikasi &amp; Ganti
                </button>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={requestOtp.isPending || countdown > 0}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-(--cat-stone) font-hanken text-[11px] font-semibold text-(--cat-on-surface) disabled:opacity-50 cursor-pointer"
                >
                  <RotateCcw size={12} />
                  {countdown > 0 ? `Kirim ulang ${countdown}s` : 'Kirim ulang OTP'}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={reset}
              disabled={requestOtp.isPending || updateWhatsapp.isPending}
              className="px-3 py-2.5 font-hanken text-[11px] font-semibold text-(--cat-on-surface-variant) hover:text-(--cat-on-surface) cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
