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
import { Loader2 } from 'lucide-react';
import { userSchema, type UserFormValues } from '../schemas/schema';
import { useCreateUserMutation } from '../api/create-user';
import { useUpdateUser } from '../hooks/use-update-user';
import type { User } from '../types/user.types';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
}

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' }
];

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const isEditing = !!user;
  const createUserMutation = useCreateUserMutation();
  const updateUserMutation = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors }
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'User',
      status: 'active'
    }
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        role: user.role ?? 'User',
        status: user.status ?? 'active'
      });
    } else {
      reset({
        name: '',
        email: '',
        role: 'User',
        status: 'active'
      });
    }
  }, [user, reset, open]);

  const isLoading = createUserMutation.isPending || updateUserMutation.isPending;

  const onSubmit = async (values: UserFormValues) => {
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

          <FormInput
            label="Role"
            placeholder="Admin, Developer, Manager..."
            error={errors.role?.message}
            {...register('role')}
          />

          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <FormSelect
                label="Status"
                value={field.value}
                onValueChange={field.onChange}
                options={statusOptions}
                error={errors.status?.message}
              />
            )}
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
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
