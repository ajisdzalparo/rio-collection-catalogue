'use client';

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormInput, FormSelect } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff, Sparkles, Copy, Check, Loader2, UserPlus, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { userSchema, type UserFormValues } from '../schemas/schema';
import { useCreateUserMutation } from '../api/create-user';
import { useUpdateUser } from '../hooks/use-update-user';
import { useRbac, useRolesQuery } from '../hooks/use-rbac';
import type { User } from '../types/user.types';
import { isSuperAdminRole } from '@/lib/auth/roles';
import { useAuth } from '@/hooks/use-auth';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const isEditing = !!user;
  const createUserMutation = useCreateUserMutation();
  const updateUserMutation = useUpdateUser();
  const { user: authUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const isSuperAdminTarget = isEditing && isSuperAdminRole(user?.role);
  const isProtectedSuperAdminTarget = isSuperAdminTarget && !isSuperAdminRole(authUser?.role);
  const isSelfTarget = isEditing && authUser?.id === user?.id;
  const { data: roles = [] } = useRolesQuery();
  const { currentRoleName } = useRbac();
  const canAssignSuperAdmin = isSuperAdminRole(currentRoleName);

  const roleOptions = roles
    .filter(
      (role) =>
        role.isActive !== false &&
        (!isSuperAdminRole(role.name) ||
          canAssignSuperAdmin ||
          (isEditing && isSuperAdminRole(user?.role)))
    )
    .map((role) => ({ label: role.name, value: role.name }));

  const hasLegacyRole = !!user?.role && !roleOptions.some((option) => option.value === user.role);
  if (hasLegacyRole && user?.role) {
    roleOptions.push({ label: `${user.role} (role saat ini)`, value: user.role });
  }

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    control,
    formState: { errors }
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: '',
      password: '',
      status: 'active'
    }
  });

  const watchedPassword = watch('password') || '';

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        role: user.role ?? '',
        password: '',
        status: user.status ?? 'active'
      });
    } else {
      reset({
        name: '',
        email: '',
        role: '',
        password: '',
        status: 'active'
      });
    }
    setShowPassword(false);
    setCopied(false);
  }, [user, reset, open]);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let result = 'Rio';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    result += '!26';
    setValue('password', result, { shouldValidate: true });
    setShowPassword(true);
    toast.info('Kata sandi acak berhasil dibuat.');
  };

  const handleCopyPassword = async () => {
    if (!watchedPassword) return;
    try {
      await navigator.clipboard.writeText(watchedPassword);
      setCopied(true);
      toast.success('Kata sandi disalin ke clipboard.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin kata sandi.');
    }
  };

  const isLoading = createUserMutation.isPending || updateUserMutation.isPending;

  const onSubmit = async (values: UserFormValues) => {
    if (!values.role || !roleOptions.some((option) => option.value === values.role)) {
      setError('role', { type: 'validate', message: 'Pilih role dari daftar master role.' });
      return;
    }

    if (!isEditing && (!values.password || values.password.trim().length < 8)) {
      setError('password', {
        type: 'validate',
        message: 'Kata sandi wajib diisi minimal 8 karakter untuk pengguna baru.'
      });
      return;
    }

    try {
      if (isEditing && user) {
        await updateUserMutation.mutateAsync({ id: user.id, payload: values });
      } else {
        await createUserMutation.mutateAsync(values as Required<UserFormValues>);
      }
      onOpenChange(false);
      reset();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-card border-border/50 shadow-xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            {isEditing ? <UserCog className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            <span>{isEditing ? 'Kelola Akun' : 'Pengguna Baru'}</span>
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            {isEditing ? 'Edit Akun Pengguna' : 'Tambah Pengguna Baru'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEditing
              ? 'Perbarui detail nama, email, role akses, atau status pengguna.'
              : 'Tambahkan staf baru dan atur kata sandi untuk login dashboard.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <FormInput
            label="Nama Lengkap"
            placeholder="Contoh: Budi Santoso"
            error={errors.name?.message}
            {...register('name')}
          />

          <FormInput
            label="Alamat Email"
            type="email"
            placeholder="nama@riocollection.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <FormSelect
                label="Role Akses"
                placeholder="Pilih role pengguna"
                value={field.value}
                onValueChange={field.onChange}
                options={roleOptions}
                disabled={isLoading || roleOptions.length === 0 || isSuperAdminTarget}
                error={errors.role?.message}
              />
            )}
          />
          {roleOptions.length === 0 && (
            <p role="status" className="text-xs text-muted-foreground">
              Belum ada role aktif. Tambahkan role melalui menu Master Roles terlebih dahulu.
            </p>
          )}

          {/* Password Input Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">
                {isEditing ? 'Kata Sandi Baru (Opsional)' : 'Kata Sandi Akun *'}
              </Label>
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
                placeholder={
                  isEditing
                    ? 'Kosongkan jika tidak ingin mengubah sandi'
                    : 'Minimal 8 karakter'
                }
                {...register('password')}
                className="h-10 text-xs pr-20 rounded-xl bg-muted/20 border-border/50"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                {watchedPassword && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyPassword}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Salin password"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                  title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
            {errors.password && (
              <p className="text-[11px] font-medium text-destructive">
                {errors.password.message}
              </p>
            )}
            {!isEditing && (
              <p className="text-[10px] text-muted-foreground">
                Sandi ini akan langsung digunakan staf saat login pertama kali.
              </p>
            )}
          </div>

          <Controller
            name="status"
            control={control}
            render={({ field }) => {
              const isActive = field.value === 'active';
              return (
                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 p-3.5">
                  <div className="space-y-0.5">
                    <label
                      htmlFor="user-status-switch"
                      className="text-xs font-bold text-foreground cursor-pointer"
                    >
                      Status Akun
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      {isActive
                        ? 'Pengguna aktif (dapat login ke CMS)'
                        : 'Pengguna nonaktif (akses diblokir)'}
                    </p>
                  </div>
                  <Switch
                    id="user-status-switch"
                    checked={isActive}
                    disabled={isLoading || isProtectedSuperAdminTarget || isSelfTarget}
                    onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')}
                  />
                </div>
              );
            }}
          />

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading || roleOptions.length === 0}
              className="h-9 rounded-xl text-xs font-bold gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isEditing ? 'Simpan Perubahan' : 'Tambah Pengguna'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
