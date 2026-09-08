'use client';

import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, KeyRound } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { UserFormDialog } from './user-form-dialog';
import { ResetPasswordDialog } from './reset-password-dialog';
import { useDeleteUser } from '../hooks/use-delete-user';
import { useRbac } from '../hooks/use-rbac';
import { useAuth } from '@/hooks/use-auth';
import type { User } from '../types/user.types';

interface UserActionsProps {
  user: User;
}

export function UserActions({ user }: UserActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const deleteUserMutation = useDeleteUser();
  const { user: authUser } = useAuth();
  const { hasPermission, currentRoleName } = useRbac();

  const authRole = (authUser?.role || '').toLowerCase();
  const activeRole = (currentRoleName || '').toLowerCase();
  const isAdminOrSuper =
    authRole.includes('admin') ||
    authRole.includes('super') ||
    authRole.includes('owner') ||
    activeRole.includes('admin') ||
    activeRole.includes('super') ||
    activeRole.includes('owner') ||
    !currentRoleName;

  const canManage = isAdminOrSuper || hasPermission('users.manage');
  const canResetPassword = isAdminOrSuper || hasPermission('users.reset_password');
  const canDelete = isAdminOrSuper || hasPermission('users.delete');

  const handleDelete = async () => {
    try {
      await deleteUserMutation.mutateAsync(user.id);
      setShowDeleteDialog(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-48 rounded-2xl border-border/40 p-1.5 shadow-lg">
          <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">
            Aksi Pengguna
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border/20 -mx-1 my-1" />

          {canManage && (
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-xs font-semibold rounded-xl py-2 px-2.5"
              onClick={() => setShowEditDialog(true)}
            >
              <Edit className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Edit Pengguna</span>
            </DropdownMenuItem>
          )}

          {canResetPassword && (
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-xs font-semibold rounded-xl py-2 px-2.5 text-primary focus:text-primary"
              onClick={() => setShowResetPasswordDialog(true)}
            >
              <KeyRound className="h-3.5 w-3.5 text-primary" />
              <span>Reset Password</span>
            </DropdownMenuItem>
          )}

          {canDelete && (
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-xs font-semibold rounded-xl py-2 px-2.5 text-destructive focus:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Hapus Pengguna</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <UserFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        user={user}
      />

      <ResetPasswordDialog
        open={showResetPasswordDialog}
        onOpenChange={setShowResetPasswordDialog}
        user={user}
      />

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Konfirmasi Hapus Pengguna"
        description={`Apakah Anda yakin ingin menghapus pengguna "${user.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Pengguna"
        cancelText="Batal"
        variant="destructive"
        isLoading={deleteUserMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
