'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';
import { usePasswordReset } from '@/hooks/use-password-reset';

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
}

type RecoveryStep = 'email' | 'otp' | 'success';

function getErrorMessage(error: unknown) {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (error as Error)?.message ||
    'Permintaan pemulihan akun gagal.'
  );
}

export function ForgotPasswordDialog({
  open,
  onOpenChange,
  defaultEmail = ''
}: ForgotPasswordDialogProps) {
  const { requestReset, confirmReset, isRequesting, isConfirming } = usePasswordReset();
  const [step, setStep] = useState<RecoveryStep>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const targetEmail = (email || defaultEmail).trim().toLowerCase();

  const resetState = () => {
    setStep('email');
    setEmail('');
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetState();
    onOpenChange(nextOpen);
  };

  const handleRequestOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!targetEmail) {
      toast.error('Masukkan alamat email Anda.');
      return;
    }

    try {
      const result = await requestReset(targetEmail);
      setEmail(targetEmail);
      setStep('otp');
      toast.success(result.message);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleConfirmReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otpCode)) {
      toast.error('Kode OTP harus terdiri dari 6 digit.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Kata sandi baru minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    try {
      const message = await confirmReset({ email: targetEmail, otpCode, newPassword });
      setStep('success');
      toast.success(message);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const resendOtp = async () => {
    try {
      const result = await requestReset(targetEmail);
      toast.success(result.message);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl p-6 bg-card border-border/50 shadow-xl">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <KeyRound className="h-4 w-4" />
            <span>Pemulihan Akun</span>
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            {step === 'success' ? 'Kata Sandi Diperbarui' : 'Lupa Kata Sandi?'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {step === 'email' && 'Masukkan email akun terdaftar untuk menerima kode OTP pemulihan.'}
            {step === 'otp' && `Masukkan kode OTP yang dikirim ke ${targetEmail}, lalu buat kata sandi baru.`}
            {step === 'success' && 'Pemulihan akun selesai. Anda sekarang dapat masuk memakai kata sandi baru.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'email' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="recovery-email" className="text-xs font-bold text-foreground">Alamat Email Terdaftar</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="recovery-email" type="email" value={email || defaultEmail} onChange={(event) => setEmail(event.target.value)} placeholder="admin@riocollection.id" className="pl-10 h-10 text-xs rounded-lg bg-muted/20 border-border/50" required />
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/15 text-primary text-[11px] leading-relaxed flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>OTP berlaku selama 10 menit dan maksimal lima kali percobaan.</span>
            </div>
            <DialogFooter className="gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="h-9 rounded-lg text-xs font-semibold">Batal</Button>
              <Button type="submit" disabled={isRequesting} className="h-9 rounded-lg text-xs font-bold gap-1.5">
                {isRequesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                <span>{isRequesting ? 'Mengirim...' : 'Kirim Kode OTP'}</span>
              </Button>
            </DialogFooter>
          </form>
        ) : step === 'otp' ? (
          <form onSubmit={handleConfirmReset} className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="recovery-otp" className="text-xs font-bold text-foreground">Kode OTP</label>
              <Input id="recovery-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otpCode} onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ''))} placeholder="000000" className="h-10 text-center font-mono text-base tracking-[0.35em] rounded-lg" required />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="recovery-password" className="text-xs font-bold text-foreground">Kata Sandi Baru</label>
              <div className="relative">
                <Input id="recovery-password" type={showPassword ? 'text' : 'password'} minLength={8} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Minimal 8 karakter" className="h-10 pr-10 rounded-lg" required />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="recovery-password-confirm" className="text-xs font-bold text-foreground">Konfirmasi Kata Sandi</label>
              <Input id="recovery-password-confirm" type={showPassword ? 'text' : 'password'} minLength={8} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Ulangi kata sandi baru" className="h-10 rounded-lg" required />
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <button type="button" onClick={() => setStep('email')} className="font-semibold text-muted-foreground hover:text-foreground">Ganti email</button>
              <button type="button" onClick={resendOtp} disabled={isRequesting} className="font-semibold text-primary disabled:opacity-50">Kirim ulang OTP</button>
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" disabled={isConfirming} className="w-full h-10 rounded-lg text-xs font-bold gap-1.5">
                {isConfirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                <span>{isConfirming ? 'Memverifikasi...' : 'Reset Kata Sandi'}</span>
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 pt-3">
            <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <p className="text-xs leading-relaxed text-muted-foreground">Kata sandi untuk <strong className="text-foreground">{targetEmail}</strong> berhasil diperbarui.</p>
            </div>
            <Button type="button" onClick={() => handleOpenChange(false)} className="w-full h-10 rounded-lg text-xs font-bold">Kembali ke Login</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
