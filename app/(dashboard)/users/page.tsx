'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { CmsPageSkeleton } from '@/components/shared/cms-page-skeleton';
import { SkeletonTable } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';

function UsersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
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

  const { data: mockRoles, isLoading: rolesLoading } = useRolesQuery();
  const { setRoles } = useRbacStore();

  useEffect(() => {
    if (mockRoles && mockRoles.length > 0) {
      setRoles(mockRoles);
    }
  }, [mockRoles, setRoles]);

  const handleOpenAddRole = () => {
    setShowRoleDialog(true);
  };

  const handleOpenEditRole = (role: UserRole) => {
    router.push(`/users/roles/${encodeURIComponent(role.name)}/edit`);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title={currentHeader.title} description={currentHeader.desc}>
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
        <Suspense fallback={<SkeletonTable rows={6} cols={5} />}>
          <UserTable />
        </Suspense>
      ) : rolesLoading ? (
        <SkeletonTable rows={5} cols={4} />
      ) : (
        <RoleTable onEditRole={handleOpenEditRole} />
      )}

      <UserFormDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      <RoleFormDialog open={showRoleDialog} onOpenChange={setShowRoleDialog} />
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<CmsPageSkeleton variant="list" />}>
      <UsersPageContent />
    </Suspense>
  );
}
