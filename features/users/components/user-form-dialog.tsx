'use client';

import React, { useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { userSchema, type UserFormValues } from '../schemas/schema';
import { useCreateUserMutation } from '../api/create-user';
import { useUpdateUser } from '../hooks/use-update-user';
import { useRbacStore } from '../hooks/use-rbac';
import type { User } from '../types/user.types';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const isEditing = !!user;
  const createUserMutation = useCreateUserMutation();
  const updateUserMutation = useUpdateUser();
  const roles = useRbacStore((state) => state.roles);
  const roleOptions = roles
    .filter((role) => role.isActive !== false)
    .map((role) => ({ label: role.name, value: role.name }));
  const hasLegacyRole = !!user?.role && !roleOptions.some((option) => option.value === user.role);
  if (hasLegacyRole && user?.role) {
    roleOptions.push({ label: `${user.role} (role saat ini)`, value: user.role });
  }

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors }
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: '',
      status: 'active'
    }
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        role: user.role ?? '',
        status: user.status ?? 'active'
      });
    } else {
      reset({
        name: '',
        email: '',
        role: '',
        status: 'active'
      });
    }
  }, [user, reset, open]);

  const isLoading = createUserMutation.isPending || updateUserMutation.isPending;

  const onSubmit = async (values: UserFormValues) => {
    if (!values.role || !roleOptions.some((option) => option.value === values.role)) {
      setError('role', { type: 'validate', message: 'Pilih role dari daftar master role.' });
      return;
    }
    try {
      if (isEditing && user) {
        await updateUserMutation.mutateAsync({ id: user.id, payload: values });
      } else {
        await createUserMutation.mutateAsync(values);
      }
      onOpenChange(false);
      reset();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit User' : 'Create New User'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details for this user.' : 'Add a new user to the system.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <FormInput
            label="Name"
            placeholder="John Doe"
            error={errors.name?.message}
            {...register('name')}
          />

          <FormInput
            label="Email"
            type="email"
            placeholder="john@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <FormSelect
                label="Role"
                placeholder="Pilih role pengguna"
                value={field.value}
                onValueChange={field.onChange}
                options={roleOptions}
                disabled={isLoading || roleOptions.length === 0}
                error={errors.role?.message}
              />
            )}
          />
          {roleOptions.length === 0 && (
            <p role="status" className="text-xs text-muted-foreground">
              Belum ada role aktif. Tambahkan role melalui menu Roles &amp; RBAC terlebih dahulu.
            </p>
          )}
          {hasLegacyRole && (
            <p role="status" className="text-xs text-muted-foreground">
              Role saat ini tidak ada dalam daftar role aktif. Pilih role aktif untuk menggantinya,
              atau biarkan untuk mempertahankan role pengguna.
            </p>
          )}

          <Controller
            name="status"
            control={control}
            render={({ field }) => {
              const isActive = field.value === 'active';
              return (
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/15 p-3.5 shadow-2xs">
                  <div className="space-y-0.5">
                    <label
                      htmlFor="user-status-switch"
                      className="text-xs font-bold text-foreground cursor-pointer"
                    >
                      Status
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      {isActive
                        ? 'Pengguna aktif dan dapat login ke dashboard'
                        : 'Pengguna nonaktif (akses diblokir)'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        'text-xs font-semibold select-none',
                        isActive ? 'text-emerald-500 font-bold' : 'text-muted-foreground'
                      )}
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                    <Switch
                      id="user-status-switch"
                      checked={isActive}
                      onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')}
                    />
                  </div>
                </div>
              );
            }}
          />

          <DialogFooter className="pt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || roleOptions.length === 0}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
