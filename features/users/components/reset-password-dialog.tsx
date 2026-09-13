'use client';

import React, { useState } from 'react';
import axios from 'axios';
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
import { Badge } from '@/components/ui/badge';
import { KeyRound, Eye, EyeOff, Sparkles, Copy, Check, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '../types/user.types';
import { useResetUserPassword } from '../hooks/use-reset-user-password';

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  user
}: ResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const resetPassword = useResetUserPassword();
  const isLoading = resetPassword.isPending;

  if (!user) return null;

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let result = 'Rio';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    result += '!26';
    setNewPassword(result);
    setConfirmPassword(result);
    setShowPassword(true);
    toast.info('Kata sandi acak berhasil dibuat.');
  };

  const handleCopy = async () => {
    if (!newPassword) return;
    try {
      await navigator.clipboard.writeText(newPassword);
      setCopied(true);
      toast.success('Kata sandi disalin ke clipboard.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin kata sandi.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 8) {
      toast.error('Kata sandi baru minimal 8 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    try {
      await resetPassword.mutateAsync({
        id: user.id,
        newPassword
      });
      toast.success(`Kata sandi untuk akun "${user.name}" (${user.email}) berhasil diperbarui!`);
      setNewPassword('');
      setConfirmPassword('');
      onOpenChange(false);
    } catch (err: unknown) {
      const errorMsg = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : err instanceof Error
          ? err.message
          : undefined;
      toast.error(errorMsg || 'Gagal mereset kata sandi.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-card border-border/50">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <KeyRound className="h-4 w-4" />
            <span>Reset Kredensial Pengguna</span>
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            Reset Password Staf
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Atur ulang kata sandi masuk dashboard untuk staf berikut.
          </DialogDescription>
        </DialogHeader>

        {/* User Info Card */}
        <div className="bg-muted/30 border border-border/30 rounded-2xl p-3.5 flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
          </div>
          <Badge variant="outline" className="capitalize text-[10px] font-semibold shrink-0">
            {user.role ?? 'User'}
          </Badge>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* New Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">Kata Sandi Baru</label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                <span>Buat Sandi Acak</span>
              </button>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimal 8 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-10 text-xs pr-20 rounded-xl bg-muted/20 border-border/50"
                required
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                {newPassword && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    title="Salin password"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Konfirmasi Kata Sandi</label>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Ulangi kata sandi baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-10 text-xs rounded-xl bg-muted/20 border-border/50"
              required
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] leading-relaxed flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Pastikan Anda mencatat dan memberikan kata sandi baru ini kepada staf bersangkutan
              secara langsung.
            </span>
          </div>

          <DialogFooter className="gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-9 rounded-xl text-xs font-bold gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Simpan Password Baru</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
