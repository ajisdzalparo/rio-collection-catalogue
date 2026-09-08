import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column, CMSBadge } from '@/components/shared';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, ShieldCheck, CheckCircle2, Eye, Lock } from 'lucide-react';
import type { UserRole } from '../types/roles.types';
import { PERMISSION_TREE } from '../data/permission-tree';
import { useRbacStore, syncRolePermissions } from '../hooks/use-rbac';
import { toast } from 'sonner';

interface RoleTableProps {
  onEditRole: (role: UserRole) => void;
  onViewRoleDetail?: (role: UserRole) => void;
}

export function RoleTable({ onEditRole, onViewRoleDetail }: RoleTableProps) {
  const router = useRouter();
  const { roles, deleteRole, updateRole } = useRbacStore();
  const [deleteTargetRole, setDeleteTargetRole] = useState<string | null>(null);

  const totalActionsCount = PERMISSION_TREE.reduce(
    (acc, menu) => acc + menu.actions.length,
    0
  );

  const isProtectedSystemRole = (name: string) => {
    const lower = name.toLowerCase().trim();
    return lower === 'admin' || lower === 'super admin' || lower === 'superadmin';
  };

  const handleViewDetail = (role: UserRole) => {
    if (onViewRoleDetail) {
      onViewRoleDetail(role);
    } else {
      router.push(`/users/roles/${encodeURIComponent(role.name.toLowerCase())}`);
    }
  };

  const handleDelete = (roleName: string) => {
    if (isProtectedSystemRole(roleName)) {
      toast.error(`Master role "${roleName}" adalah role sistem utama dan tidak dapat dihapus.`);
      return;
    }
    setDeleteTargetRole(roleName);
  };

  const confirmDelete = () => {
    if (deleteTargetRole) {
      if (isProtectedSystemRole(deleteTargetRole)) {
        toast.error(`Master role "${deleteTargetRole}" adalah role sistem utama dan tidak dapat dihapus.`);
        setDeleteTargetRole(null);
        return;
      }
      deleteRole(deleteTargetRole);
      toast.success(`Master role "${deleteTargetRole}" berhasil dihapus.`);
      setDeleteTargetRole(null);
    }
  };

  const columns: Column<UserRole>[] = [
    {
      header: 'Master Role',
      accessorKey: 'name',
      sortable: true,
      cell: (role) => (
        <div className="flex flex-col py-1">
          <span className="font-bold text-foreground text-sm uppercase tracking-wide">
            {role.name}
          </span>
          {role.description && (
            <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
              {role.description}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Hak Akses Menu (Permissions)',
      accessorKey: 'permissions',
      cell: (role) => {
        const syncedPerms = syncRolePermissions(role.permissions, role.name);
        let activeCount = 0;
        PERMISSION_TREE.forEach((menu) => {
          menu.actions.forEach((act) => {
            if (syncedPerms[act.key]) {
              activeCount += 1;
            }
          });
        });

        const isFullAccess = activeCount >= totalActionsCount || isProtectedSystemRole(role.name);

        return (
          <div className="flex items-center py-1">
            <CMSBadge variant={isFullAccess ? 'success' : activeCount > 0 ? 'info' : 'neutral'}>
              {isFullAccess ? (
                <span className="flex items-center">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-200 inline" />
                  Akses Penuh
                </span>
              ) : (
                <span className="flex items-center">
                  <ShieldCheck className="h-3 w-3 mr-1 inline" />
                  {activeCount} / {totalActionsCount} Akses Menu
                </span>
              )}
            </CMSBadge>
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      className: 'w-24 text-center',
      cell: (role) => (
        <div className="flex items-center justify-center">
          <Switch
            checked={role.isActive ?? true}
            disabled={isProtectedSystemRole(role.name)}
            onCheckedChange={(checked) => {
              updateRole(role.name, { isActive: checked });
            }}
          />
        </div>
      )
    },
    {
      header: 'Actions',
      className: 'w-32 text-right',
      cell: (role) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewDetail(role)}
            className="h-8 px-2 cursor-pointer gap-1.5 text-xs font-semibold hover:bg-muted"
            title="Lihat Detail Role"
          >
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Detail</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEditRole(role)}
            className="h-8 px-2 cursor-pointer gap-1.5 text-xs font-semibold hover:bg-muted"
            title="Edit Role & Permissions"
          >
            <Edit className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Edit</span>
          </Button>

          {isProtectedSystemRole(role.name) ? (
            <Button
              size="sm"
              variant="ghost"
              disabled
              className="h-8 w-8 p-0 opacity-40 cursor-not-allowed text-muted-foreground"
              title={`Role sistem ${role.name} tidak dapat dihapus`}
            >
              <Lock className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDelete(role.name)}
              className="h-8 w-8 p-0 cursor-pointer text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Hapus Role"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={roles}
        getRowId={(role) => role.id || role.name}
        searchKey="name"
        searchPlaceholder="Cari master role berdasarkan nama..."
      />
      <ConfirmModal
        open={Boolean(deleteTargetRole)}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetRole(null);
        }}
        title="Konfirmasi Hapus Master Role"
        description={
          deleteTargetRole
            ? `Apakah Anda yakin ingin menghapus master role "${deleteTargetRole}"?`
            : ''
        }
        confirmText="Hapus Role"
        cancelText="Batal"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </>
  );
}
