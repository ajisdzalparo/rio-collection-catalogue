'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowRight, Loader2, CheckCircle2, User, Phone } from 'lucide-react';
import { useCustomerStore } from '@/lib/customer-store';
import { cn } from '@/lib/utils';
import {
  useSendCustomerOtp,
  useVerifyCustomerOtp
} from '@/hooks/use-customer-account';
import { toast } from 'sonner';

export default function CustomerLoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useCustomerStore();

  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const sendOtpMutation = useSendCustomerOtp();
  const verifyOtpMutation = useVerifyCustomerOtp();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/customer/account');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Masukkan alamat email yang valid.');
      return;
    }

    setDevOtpHint(null);
    try {
      const data = await sendOtpMutation.mutateAsync({ email: email.trim() });
      toast.success('Kode OTP telah dikirim ke email Anda.');
      if (data.isDevMode && data.message) {
        setDevOtpHint(data.message);
      }
      setStep('OTP');
      setCountdown(60);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengirim OTP.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error('Masukkan 6 digit kode OTP.');
      return;
    }

    try {
      await verifyOtpMutation.mutateAsync({
        email: email.trim(),
        code: otpCode.trim(),
        fullName: fullName.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined
      });

      toast.success('Berhasil masuk!');
      router.push('/customer/account');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Verifikasi OTP gagal.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 md:py-20 bg-(--cat-surface)">
      <div className="w-full max-w-md bg-(--cat-surface-container-low) border border-(--cat-stone) p-8 md:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-block font-eb-garamond text-[28px] font-normal tracking-[-0.01em] text-(--cat-on-surface) mb-2"
          >
            RIO COLLECTION
          </Link>
          <h1 className="font-eb-garamond text-[22px] md:text-[24px] text-(--cat-on-surface)">
            {step === 'EMAIL' ? 'Masuk ke Akun Pelanggan' : 'Verifikasi Kode OTP'}
          </h1>
          <p className="font-hanken text-[13px] text-(--cat-on-surface-variant) mt-1">
            {step === 'EMAIL'
              ? 'Masuk atau daftar otomatis menggunakan email Anda.'
              : `Kode 6-digit telah dikirim ke ${email}`}
          </p>
        </div>

        {devOtpHint && (
          <div className="mb-6 p-3.5 bg-amber-50 border border-amber-300 text-amber-950 text-xs font-mono rounded shadow-xs leading-relaxed">
            <span className="font-bold text-amber-900">⚡ DEV MODE:</span>{' '}
            {devOtpHint.replace('[DEV MODE] ', '')}
          </div>
        )}

        {step === 'EMAIL' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
                Alamat Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full h-11 pl-10 pr-3 font-hanken text-[14px] bg-(--cat-surface) border border-(--cat-stone) focus:border-(--cat-charcoal) focus:outline-none transition-colors"
                />
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-(--cat-on-surface-variant)"
                  size={16}
                />
              </div>
            </div>

            <div>
              <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
                Nama Lengkap (Opsional untuk akun baru)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama Lengkap Anda"
                  className="w-full h-11 pl-10 pr-3 font-hanken text-[14px] bg-(--cat-surface) border border-(--cat-stone) focus:border-(--cat-charcoal) focus:outline-none transition-colors"
                />
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-(--cat-on-surface-variant)"
                  size={16}
                />
              </div>
            </div>

            <div>
              <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
                No. WhatsApp (Opsional)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="081234567890"
                  className="w-full h-11 pl-10 pr-3 font-hanken text-[14px] bg-(--cat-surface) border border-(--cat-stone) focus:border-(--cat-charcoal) focus:outline-none transition-colors"
                />
                <Phone
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-(--cat-on-surface-variant)"
                  size={16}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={sendOtpMutation.isPending}
              className={cn(
                'w-full h-11 mt-6 flex items-center justify-center gap-2 bg-(--cat-charcoal) text-white font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] transition-opacity cursor-pointer',
                sendOtpMutation.isPending
                  ? 'opacity-70 cursor-not-allowed'
                  : 'hover:opacity-90'
              )}
            >
              {sendOtpMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={14} /> Mengirim OTP...
                </>
              ) : (
                <>
                  Kirim Kode OTP <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) mb-1.5">
                Masukkan 6 Digit Kode OTP
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full h-12 text-center tracking-[8px] font-mono text-[22px] font-bold bg-(--cat-surface) border border-(--cat-stone) focus:border-(--cat-charcoal) focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={verifyOtpMutation.isPending || otpCode.length !== 6}
              className={cn(
                'w-full h-11 mt-6 flex items-center justify-center gap-2 bg-(--cat-charcoal) text-white font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] transition-opacity cursor-pointer',
                verifyOtpMutation.isPending || otpCode.length !== 6
                  ? 'opacity-70 cursor-not-allowed'
                  : 'hover:opacity-90'
              )}
            >
              {verifyOtpMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={14} /> Memverifikasi...
                </>
              ) : (
                <>
                  Masuk Sekarang <CheckCircle2 size={14} />
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-4 border-t border-(--cat-stone)/50 font-hanken text-[12px]">
              <button
                type="button"
                onClick={() => setStep('EMAIL')}
                className="text-(--cat-on-surface-variant) hover:text-(--cat-on-surface) underline cursor-pointer"
              >
                Ganti Email
              </button>

              <button
                type="button"
                disabled={countdown > 0 || sendOtpMutation.isPending}
                onClick={handleSendOtp}
                className={cn(
                  'text-(--cat-on-surface-variant) cursor-pointer',
                  countdown > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:text-(--cat-on-surface) underline'
                )}
              >
                {countdown > 0 ? `Kirim ulang (${countdown}s)` : 'Kirim Ulang OTP'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
