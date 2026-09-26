import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { DataTable, type Column, CMSBadge } from '@/components/shared';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { SquarePen, Trash2, ShieldCheck, CheckCircle2, Eye, Lock } from 'lucide-react';
import type { UserRole } from '../types/roles.types';
import { PERMISSION_TREE } from '../data/permission-tree';
import { useRolesPageQuery, syncRolePermissions } from '../hooks/use-rbac';
import { useRoleMutations } from '../hooks/use-role-mutations';
import { toast } from 'sonner';
import { isSuperAdminRole, normalizeRoleName } from '@/lib/auth/roles';
import { useAuth } from '@/hooks/use-auth';
import { useDebounce } from '@/hooks/use-debounce';

interface RoleTableProps {
  onEditRole: (role: UserRole) => void;
  onViewRoleDetail?: (role: UserRole) => void;
}

export function RoleTable({ onEditRole, onViewRoleDetail }: RoleTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data, isLoading } = useRolesPageQuery({
    search: debouncedSearch.trim() || undefined,
    page,
    pageSize
  });
  const roles = data?.roles ?? [];
  const meta = data?.meta ?? { page: 1, pageSize, total: 0, totalPages: 1 };
  const { update, remove } = useRoleMutations();
  const { user: authUser } = useAuth();
  const [deleteTargetRole, setDeleteTargetRole] = useState<string | null>(null);

  const totalActionsCount = PERMISSION_TREE.reduce((acc, menu) => acc + menu.actions.length, 0);

  const isProtectedSystemRole = (name: string) => {
    return isSuperAdminRole(name);
  };

  const isRoleDeleteLocked = (name: string) => {
    return (
      isProtectedSystemRole(name) || normalizeRoleName(name) === normalizeRoleName(authUser?.role)
    );
  };

  const handleViewDetail = (role: UserRole) => {
    if (onViewRoleDetail) {
      onViewRoleDetail(role);
    } else {
      router.push(`/users/roles/${encodeURIComponent(role.name.toLowerCase())}`);
    }
  };

  const handleDelete = (roleName: string) => {
    if (isRoleDeleteLocked(roleName)) {
      toast.error(
        isProtectedSystemRole(roleName)
          ? `Master role "${roleName}" adalah role sistem utama dan tidak dapat dihapus.`
          : 'Role yang sedang digunakan akun Anda tidak dapat dihapus.'
      );
      return;
    }
    setDeleteTargetRole(roleName);
  };

  const confirmDelete = async () => {
    if (!deleteTargetRole) return;

    if (isRoleDeleteLocked(deleteTargetRole)) {
      toast.error(
        isProtectedSystemRole(deleteTargetRole)
          ? `Master role "${deleteTargetRole}" adalah role sistem utama dan tidak dapat dihapus.`
          : 'Role yang sedang digunakan akun Anda tidak dapat dihapus.'
      );
      setDeleteTargetRole(null);
      return;
    }

    const target = roles.find((role) => role.name === deleteTargetRole);
    if (!target) {
      setDeleteTargetRole(null);
      return;
    }

    if (target.id) {
      try {
        await remove.mutateAsync(target.id);
        toast.success(`Master role "${deleteTargetRole}" berhasil dihapus.`);
        setDeleteTargetRole(null);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          toast.info(`Master role "${deleteTargetRole}" telah dibersihkan dari daftar.`);
          setDeleteTargetRole(null);
          return;
        }

        const message =
          (axios.isAxiosError<{ message?: string }>(error) && error.response?.data?.message) ||
          (error instanceof Error ? error.message : 'Gagal menghapus master role.');
        toast.error(message);
      }
    } else {
      toast.error('ID role tidak tersedia. Muat ulang halaman.');
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

        const isFullAccess = activeCount >= totalActionsCount;

        return (
          <div className="flex items-center py-1">
            <CMSBadge
              variant="neutral"
              className={
                activeCount > 0
                  ? 'bg-zinc-900 hover:bg-zinc-900 text-white dark:bg-zinc-100 dark:hover:bg-zinc-100 dark:text-zinc-900'
                  : undefined
              }
            >
              {isFullAccess ? (
                <span className="flex items-center">
                  <CheckCircle2 className="h-3 w-3 mr-1 inline" />
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
            title={
              isProtectedSystemRole(role.name)
                ? 'Status role Super Admin terkunci'
                : 'Ubah status role'
            }
            className={isProtectedSystemRole(role.name) ? 'opacity-35 grayscale' : undefined}
            onCheckedChange={(checked) => {
              if (!role.id) return;
              void update.mutateAsync({ id: role.id, payload: { isActive: checked } }).catch(() => {
                toast.error('Gagal memperbarui status role. Mengembalikan ke status semula.');
              });
            }}
          />
        </div>
      )
    },
    {
      header: 'Aksi',
      className: 'w-32 text-right',
      cell: (role) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="link"
            onClick={() => handleViewDetail(role)}
            className="h-8 px-2 cursor-pointer gap-1.5 text-xs font-semibold hover:bg-muted"
            title="Lihat Detail Role"
          >
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>

          <Button
            size="sm"
            variant="link"
            onClick={() => onEditRole(role)}
            disabled={isProtectedSystemRole(role.name)}
            className="h-8 px-2 cursor-pointer gap-1.5 text-xs font-semibold hover:bg-muted"
            title={
              isProtectedSystemRole(role.name)
                ? 'Super Admin selalu full access'
                : 'Edit Role & Permissions'
            }
          >
            <SquarePen className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>

          {isRoleDeleteLocked(role.name) ? (
            <Button
              size="sm"
              variant="link"
              disabled
              className="h-8 w-8 p-0 opacity-40 cursor-not-allowed text-muted-foreground"
              title={
                isProtectedSystemRole(role.name)
                  ? `Role sistem ${role.name} tidak dapat dihapus`
                  : 'Role yang sedang digunakan akun Anda tidak dapat dihapus'
              }
            >
              <Lock className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="link"
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
        manualSearch
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        manualPagination
        page={meta.page}
        totalEntries={meta.total}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        isLoading={isLoading}
      />
      <ConfirmModal
        open={Boolean(deleteTargetRole)}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setDeleteTargetRole(null);
        }}
        isLoading={remove.isPending}
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
