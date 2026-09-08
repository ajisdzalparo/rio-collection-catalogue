'use client';

import React, { useState } from 'react';
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
import { KeyRound, Mail, CheckCircle2, ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
}

export function ForgotPasswordDialog({
  open,
  onOpenChange,
  defaultEmail = ''
}: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setEmail(defaultEmail);
      setIsSubmitted(false);
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setIsSubmitted(false);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Masukkan alamat email Anda.');
      return;
    }

    setIsLoading(true);
    // Simulate recovery request
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      toast.success('Permintaan reset kata sandi telah dikirim.');
    }, 800);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-card border-border/50 shadow-xl">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <KeyRound className="h-4 w-4" />
            <span>Pemulihan Akun</span>
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">Lupa Kata Sandi?</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {isSubmitted
              ? 'Instruksi pemulihan telah dikirimkan ke alamat email Anda.'
              : 'Masukkan alamat email akun terdaftar Anda untuk menerima tautan pemulihan kata sandi.'}
          </DialogDescription>
        </DialogHeader>

        {isSubmitted ? (
          <div className="space-y-4 py-3">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-foreground space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="h-4 w-4" />
                <span>Email Pemulihan Terkirim</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Kami telah mengirimkan instruksi reset kata sandi ke{' '}
                <strong className="text-foreground">{email}</strong>. Periksa kotak masuk atau
                folder spam Anda.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/30 text-muted-foreground text-xs space-y-1">
              <span className="font-bold text-foreground block">Opsi Alternatif untuk Staf:</span>
              <p className="text-[11px] leading-relaxed">
                Anda juga dapat meminta Administrator / Super Admin toko untuk langsung mereset kata
                sandi akun Anda melalui menu <strong>Kelola Pengguna (RBAC)</strong>.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="w-full h-10 rounded-xl text-xs font-bold cursor-pointer"
              >
                Kembali ke Halaman Login
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Alamat Email Terdaftar</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="admin@riocollection.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-10 text-xs rounded-xl bg-muted/20 border-border/50"
                  required
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/15 text-primary text-[11px] leading-relaxed flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Jika Anda adalah staf operasional dan tidak memiliki akses email, hubungi Super
                Admin untuk membuatkan kata sandi sementara.
              </span>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="h-9 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-9 rounded-xl text-xs font-bold gap-1.5 cursor-pointer bg-foreground text-background hover:bg-foreground/90 shadow-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <span>Kirim Link Reset</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
