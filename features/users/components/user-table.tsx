'use client';

import React from 'react';
import { useUsers } from '../hooks/use-users';
import { DataTable, ErrorState, type Column } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { UserActions } from './user-actions';
import { MOCK_USERS } from '../data/mock-users';
import { useUpdateUser } from '../hooks/use-update-user';
import type { User } from '../types/user.types';

function UserStatusSwitch({ user }: { user: User }) {
  const { mutateAsync: updateUser } = useUpdateUser();
  const checked = user.status === 'active';

  return (
    <Switch
      checked={checked}
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
    header: 'User',
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
    header: 'Role',
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
    header: 'Actions',
    className: 'w-16 text-right',
    cell: (user) => <UserActions user={user} />
  }
];

export default function UserTable() {
  const { data, isLoading, isError, error } = useUsers();

  const handleBulkDelete = (selected: User[], clear: () => void) => {
    toast.error(`Deleted ${selected.length} user(s)`);
    clear();
  };

  if (isError && !data) {
    return (
      <div className="space-y-4">
        <ErrorState message={error?.message || 'Failed to connect to backend server.'} />
        <p className="text-xs text-center text-muted-foreground">Showing demo fallback data below:</p>
        <DataTable
          columns={columns}
          data={MOCK_USERS}
          searchKey="name"
          searchPlaceholder="Search users..."
          enableSelection
        />
      </div>
    );
  }

  const tableData = data?.data && data.data.length > 0 ? data.data : MOCK_USERS;

  return (
    <DataTable
      columns={columns}
      data={tableData}
      searchKey="name"
      searchPlaceholder="Search users by name or email..."
      isLoading={isLoading}
      enableSelection
      bulkActions={(selected, clear) => (
        <Button
          onClick={() => handleBulkDelete(selected, clear)}
          className="gap-1.5 text-xs font-bold h-8 px-3.5 rounded-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white border-none transition-all cursor-pointer shadow-md shadow-red-950/20"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Hapus</span>
        </Button>
      )}
    />
  );
}
