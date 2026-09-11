'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Lock, Mail, ArrowRight, ShieldCheck, Shirt, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ForgotPasswordDialog } from '@/components/auth/forgot-password-dialog';

export default function LoginPage() {
  const { login, isLoggingIn, loginError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Silakan masukkan alamat email');
      return;
    }

    try {
      await login({ email: email.trim(), password });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Login gagal, periksa email dan password Anda.';
      setErrorMessage(msg);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background shadow-lg border border-border/20">
            <Shirt className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              RIO COLLECTION
            </h1>
            <p className="text-xs font-semibold text-muted-foreground mt-1">
              Dashboard CMS & Management Portal
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border/40 rounded-xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-xl">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">Selamat Datang Kembali</h2>
            <p className="text-xs text-muted-foreground">
              Masukkan akun terdaftar Anda untuk mengelola produk, pesanan, dan katalog toko.
            </p>
          </div>

          {(errorMessage || loginError) && (
            <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage || (loginError as Error)?.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Alamat Email</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Masukkan alamat email Anda"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 text-xs rounded-lg bg-muted/20 border-border/40 focus:bg-background"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  <span>Kata Sandi (Password)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  Lupa kata sandi?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Masukkan kata sandi Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 text-xs rounded-lg bg-muted/20 border-border/40 focus:bg-background"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoggingIn}
              className="w-full h-11 rounded-lg font-bold text-xs gap-2 cursor-pointer bg-foreground text-background hover:bg-foreground/90 transition-all shadow-md"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memproses Login...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Demo Login Preset Buttons */}
          <div className="pt-2 border-t border-border/20 space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">
              Pilih Akun Demo (Quick Select):
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('ajis@riocollection.com')}
                className="p-2 rounded-lg border border-border/30 bg-muted/10 hover:bg-muted/30 text-left transition-all text-[11px] cursor-pointer"
              >
                <div className="font-bold text-foreground">Ajis</div>
                <div className="text-[9px] text-muted-foreground truncate">Super Admin</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@riocollection.com')}
                className="p-2 rounded-lg border border-border/30 bg-muted/10 hover:bg-muted/30 text-left transition-all text-[11px] cursor-pointer"
              >
                <div className="font-bold text-foreground">Staff Admin</div>
                <div className="text-[9px] text-muted-foreground truncate">Staff Operational</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Security Tag */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Sistem Otorisasi RIO COLLECTION Admin v1.0</span>
        </div>
      </div>

      {/* Forgot Password Recovery Dialog */}
      <ForgotPasswordDialog
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
        defaultEmail={email}
      />
    </div>
  );
}
