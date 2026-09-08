'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import {
  UserTable,
  UserFormDialog,
  RoleFormDialog,
  RoleTable,
  useRbacStore,
  useRolesQuery,
  type UserRole
} from '@/features/users';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

function UsersPageContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'users';

  const tabInfo: Record<string, { title: string; desc: string }> = {
    users: {
      title: 'Manajemen Pengguna',
      desc: 'Kelola akun staf, hak akses login, peran, serta status aktif pengguna dashboard.'
    },
    rbac: {
      title: 'Master Roles & Permissions',
      desc: 'Kelola tingkat otorisasi, hak akses per menu, dan status aktif master role (RBAC) sistem.'
    }
  };

  const currentHeader = tabInfo[activeTab] || tabInfo.users;

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<UserRole | null>(null);
  const [deleteTargetRole, setDeleteTargetRole] = useState<string | null>(null);

  const { data: mockRoles } = useRolesQuery();
  const { roles, setRoles, deleteRole } = useRbacStore();

  useEffect(() => {
    if (mockRoles && mockRoles.length > 0 && roles.length === 0) {
      setRoles(mockRoles);
    }
  }, [mockRoles, roles.length, setRoles]);

  const handleOpenAddRole = () => {
    setRoleToEdit(null);
    setShowRoleDialog(true);
  };

  const handleOpenEditRole = (role: UserRole) => {
    setRoleToEdit(role);
    setShowRoleDialog(true);
  };

  const confirmDeleteRole = () => {
    if (deleteTargetRole) {
      if (deleteTargetRole.toLowerCase() === 'admin') {
        toast.error('Master role Admin adalah role sistem utama dan tidak dapat dihapus.');
        setDeleteTargetRole(null);
        return;
      }
      deleteRole(deleteTargetRole);
      toast.success(`Master role "${deleteTargetRole}" berhasil dihapus.`);
      setDeleteTargetRole(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={currentHeader.title}
        description={currentHeader.desc}
      >
        {activeTab === 'users' ? (
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="gap-2 rounded-xl cursor-pointer font-bold"
          >
            <Plus className="h-4 w-4" />
            <span>Add User</span>
          </Button>
        ) : (
          <Button
            onClick={handleOpenAddRole}
            className="gap-2 rounded-xl cursor-pointer font-bold bg-foreground text-background hover:bg-foreground/90"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Master Role</span>
          </Button>
        )}
      </PageHeader>

      {/* Tab Panels */}
      {activeTab === 'users' ? (
        <Suspense
          fallback={
            <div className="h-32 flex items-center justify-center">Loading User Table...</div>
          }
        >
          <UserTable />
        </Suspense>
      ) : (
        <RoleTable onEditRole={handleOpenEditRole} />
      )}

      <UserFormDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      <RoleFormDialog
        open={showRoleDialog}
        onOpenChange={setShowRoleDialog}
        roleToEdit={roleToEdit}
      />
      <ConfirmModal
        open={Boolean(deleteTargetRole)}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetRole(null);
        }}
        title="Konfirmasi Hapus Role"
        description={
          deleteTargetRole
            ? `Apakah Anda yakin ingin menghapus master role "${deleteTargetRole}"?`
            : ''
        }
        confirmText="Hapus Role"
        cancelText="Batal"
        variant="destructive"
        onConfirm={confirmDeleteRole}
      />
    </div>
  );
}


export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-foreground" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading access control panel...
          </p>
        </div>
      }
    >
      <UsersPageContent />
    </Suspense>
  );
}
