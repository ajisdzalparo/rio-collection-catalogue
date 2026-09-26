import React, { useState } from 'react';
import { useUsers } from '../hooks/use-users';
import { DataTable, ErrorState, type Column } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { UserActions } from './user-actions';
import { useUpdateUser } from '../hooks/use-update-user';
import type { User } from '../types/user.types';
import { isSuperAdminRole } from '@/lib/auth/roles';
import { useAuth } from '@/hooks/use-auth';
import { useDebounce } from '@/hooks/use-debounce';

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
    header: 'Nama',
    accessorKey: 'name',
    sortable: true
  },
  {
    header: 'Email',
    accessorKey: 'email',
    sortable: true
  },
  {
    header: 'Role',
    accessorKey: 'role',
    sortable: true,
    cell: (user) => (
      <Badge
        variant="secondary"
        className={
          isSuperAdminRole(user.role)
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            : 'bg-primary/10 text-primary border border-primary/20'
        }
      >
        {user.role}
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
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, isError, error } = useUsers({
    search: debouncedSearch.trim() || undefined,
    page,
    pageSize
  });

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
  const meta = data?.meta || { page: 1, per_page: 10, total: 0, last_page: 1 };

  return (
    <DataTable
      columns={columns}
      data={tableData}
      searchKey="name"
      searchPlaceholder="Cari pengguna berdasarkan nama atau email..."
      manualSearch
      onSearchChange={(query) => {
        setSearch(query);
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
      emptyTitle="Belum Ada Pengguna / Admin"
      emptyDescription="Klik 'Add User' di atas untuk menambahkan akun pengelola CMS baru."
    />
  );
}
