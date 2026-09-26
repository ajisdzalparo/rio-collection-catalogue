import React from 'react';
import { useUsers } from '../hooks/use-users';
import { DataTable, ErrorState, type Column } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { UserActions } from './user-actions';
import { useUpdateUser } from '../hooks/use-update-user';
import type { User } from '../types/user.types';
import { isSuperAdminRole } from '@/lib/auth/roles';
import { useAuth } from '@/hooks/use-auth';

function UserStatusSwitch({ user }: { user: User }) {
  const { mutateAsync: updateUser } = useUpdateUser();
  const { user: authUser } = useAuth();
  const checked = user.status === 'active';
  const isSelf = authUser?.id === user.id;
  const isLocked = isSelf || (isSuperAdminRole(user.role) && !isSuperAdminRole(authUser?.role));

  return (
    <Switch
      checked={checked}
      disabled={isLocked}
      aria-label={isLocked ? 'Status akun terkunci' : `Ubah status ${user.name}`}
      title={
        isSelf
          ? 'Akun sendiri tidak dapat dinonaktifkan'
          : isLocked
            ? 'Status Super Admin hanya dapat diubah oleh Super Admin'
            : 'Ubah status pengguna'
      }
      className={isLocked ? 'opacity-35 grayscale' : undefined}
      onCheckedChange={async (val) => {
        try {
          await updateUser({
            id: user.id,
            payload: { status: val ? 'active' : 'inactive' }
          });
        } catch (err) {
          console.error(err);
        }
      }}
    />
  );
}

const columns: Column<User>[] = [
  {
    header: 'Pengguna',
    accessorKey: 'name',
    sortable: true,
    cell: (user) => {
      const initials = user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      return (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold ring-2 ring-background shadow-2xs">
            {initials}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-xs">{user.name}</span>
            <span className="text-[11px] font-medium text-muted-foreground">{user.email}</span>
          </div>
        </div>
      );
    }
  },
  {
    header: 'Master Role',
    accessorKey: 'role',
    sortable: true,
    cell: (user) => (
      <Badge variant="outline" className="capitalize text-[11px] font-semibold">
        {user.role ?? 'User'}
      </Badge>
    )
  },
  {
    header: 'Status',
    accessorKey: 'status',
    sortable: true,
    cell: (user) => <UserStatusSwitch user={user} />
  },
  {
    header: 'Aksi',
    className: 'w-16 text-right',
    cell: (user) => <UserActions user={user} />
  }
];

export default function UserTable() {
  const { data, isLoading, isError, error } = useUsers();

  if (isError && !data) {
    return (
      <div className="space-y-4">
        <ErrorState message={error?.message || 'Gagal terhubung ke server backend.'} />
        <DataTable
          columns={columns}
          data={[]}
          searchKey="name"
          searchPlaceholder="Cari pengguna berdasarkan nama atau email..."
          emptyTitle="Belum Ada Pengguna / Admin"
          emptyDescription="Klik 'Add User' di atas untuk menambahkan akun pengelola CMS baru."
        />
      </div>
    );
  }

  const tableData = data?.data || [];

  return (
    <DataTable
      columns={columns}
      data={tableData}
      searchKey="name"
      searchPlaceholder="Cari pengguna berdasarkan nama atau email..."
      isLoading={isLoading}
      emptyTitle="Belum Ada Pengguna / Admin"
      emptyDescription="Klik 'Add User' di atas untuk menambahkan akun pengelola CMS baru."
    />
  );
}
