'use client';

import { ShieldCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import type { UserRole } from '../types/roles.types';
import { useRoleMutations } from '../hooks/use-role-mutations';
import { RolePermissionForm, type RoleFormValues } from './role-permission-form';

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleToEdit?: UserRole | null;
}

export function RoleFormDialog({ open, onOpenChange, roleToEdit }: RoleFormDialogProps) {
  const { create } = useRoleMutations();
  const isEditing = Boolean(roleToEdit);

  const handleSubmit = async ({ name, description, permissions }: RoleFormValues) => {
    await create.mutateAsync({ name, description, permissions });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-foreground" />
            {isEditing ? 'Edit Master Role' : 'Tambah Master Role Baru'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Ubah nama dan atur struktur tree hak akses (permissions) per menu dan aksi.'
              : 'Buat role baru dan atur struktur tree kustom hak akses menu & action.'}
          </DialogDescription>
        </DialogHeader>

        <RolePermissionForm
          key={`${roleToEdit?.name || 'new'}-${open}`}
          roleToEdit={roleToEdit}
          onSubmit={handleSubmit}
          isSubmitting={create.isPending}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
