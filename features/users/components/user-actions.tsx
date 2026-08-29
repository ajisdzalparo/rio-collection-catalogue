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
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { UserFormDialog } from './user-form-dialog';
import { useDeleteUser } from '../hooks/use-delete-user';
import type { User } from '../types/user.types';

interface UserActionsProps {
  user: User;
}

export function UserActions({ user }: UserActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteUserMutation = useDeleteUser();

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
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-44 rounded-xl border-border/40">
          <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Aksi</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border/20" />
          <DropdownMenuItem
            className="cursor-pointer gap-2 text-xs font-semibold"
            onClick={() => setShowEditDialog(true)}
          >
            <Edit className="h-4 w-4 text-muted-foreground" />
            <span>Edit Pengguna</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer gap-2 text-xs font-semibold text-destructive focus:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
            <span>Hapus Pengguna</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
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
