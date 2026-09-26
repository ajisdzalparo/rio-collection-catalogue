'use client';

import React, { use, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import {
  UserTable,
  UserFormDialog,
  RoleFormDialog,
  RoleTable,
  useRolesQuery,
  type UserRole
} from '@/features/users';
import { Button } from '@/components/ui/button';
import { CmsPageSkeleton } from '@/components/shared/cms-page-skeleton';
import { SkeletonTable } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';

interface ManajemenPenggunaTabProps {
  params: Promise<{ tab: string }>;
}

function ManajemenPenggunaContent({ tab }: { tab: string }) {
  const router = useRouter();
  const activeTab = tab === 'role' || tab === 'roles' || tab === 'rbac' ? 'rbac' : 'users';

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

  const currentHeader = tabInfo[activeTab];

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);

  const { isLoading: rolesLoading } = useRolesQuery();

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

export default function ManajemenPenggunaTabPage({ params }: ManajemenPenggunaTabProps) {
  const { tab } = use(params);

  return (
    <Suspense fallback={<CmsPageSkeleton variant="list" />}>
      <ManajemenPenggunaContent tab={tab} />
    </Suspense>
  );
}
