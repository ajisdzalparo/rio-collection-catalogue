'use client';

import React from 'react';
import { DataTable, type Column } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KeyRound, Edit, Trash2, ShieldCheck, CheckCircle2, Eye } from 'lucide-react';
import type { UserRole } from '../types/roles.types';
import { PERMISSION_TREE } from '../data/permission-tree';
import { useRbacStore } from '../hooks/use-rbac';
import { cn } from '@/lib/utils';

interface RoleTableProps {
  onEditRole: (role: UserRole) => void;
  onViewRoleDetail: (role: UserRole) => void;
}

export function RoleTable({ onEditRole, onViewRoleDetail }: RoleTableProps) {
  const { roles, deleteRole } = useRbacStore();

  const totalActionsCount = PERMISSION_TREE.reduce(
    (acc, menu) => acc + menu.actions.length,
    0
  );

  const handleDelete = (roleName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus master role "${roleName}"?`)) {
      deleteRole(roleName);
    }
  };

  const columns: Column<UserRole>[] = [
    {
      header: 'Master Role',
      accessorKey: 'name',
      sortable: true,
      cell: (role) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
            <KeyRound className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-foreground text-xs uppercase tracking-wide">
                {role.name}
              </span>
              {role.isSystemRole ? (
                <span className="text-[9px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md border border-border/40">
                  System Role
                </span>
              ) : (
                <span className="text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded-md border border-primary/20">
                  Master Custom
                </span>
              )}
            </div>
            {role.description && (
              <span className="text-[11px] text-muted-foreground line-clamp-1">
                {role.description}
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Hak Akses Menu (Permissions)',
      accessorKey: 'permissions',
      cell: (role) => {
        let activeCount = 0;
        PERMISSION_TREE.forEach((menu) => {
          menu.actions.forEach((act) => {
            if (role.permissions && role.permissions[act.key]) {
              activeCount += 1;
            }
          });
        });

        // Fallback for legacy permission flags
        if (activeCount === 0 && role.permissions) {
          const legacyKeys = [
            'viewOverview',
            'manageOrders',
            'manageProducts',
            'manageJournal',
            'manageSettings',
            'viewReports'
          ];
          activeCount = legacyKeys.filter((k) => role.permissions[k]).length;
        }

        const isFullAccess = activeCount >= totalActionsCount || role.name === 'Admin';

        return (
          <div className="flex flex-col gap-1.5 py-1">
            <div className="flex items-center gap-2">
              <Badge
                variant={isFullAccess ? 'default' : activeCount > 0 ? 'secondary' : 'outline'}
                className="text-[10px] font-bold px-2 py-0.5"
              >
                {isFullAccess ? (
                  <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-400 inline" />
                ) : (
                  <ShieldCheck className="h-3 w-3 mr-1 inline" />
                )}
                {isFullAccess ? 'Akses Penuh' : `${activeCount} / ${totalActionsCount} Akses Menu`}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1 max-w-md">
              {PERMISSION_TREE.map((menu) => {
                const hasMenuAccess = menu.actions.some(
                  (act) => role.permissions && role.permissions[act.key]
                );

                if (!hasMenuAccess && !isFullAccess) return null;

                return (
                  <span
                    key={menu.id}
                    className={cn(
                      'text-[9px] font-bold px-1.5 py-0.5 rounded border transition-colors',
                      hasMenuAccess || isFullAccess
                        ? 'bg-foreground/5 border-foreground/20 text-foreground'
                        : 'bg-muted/40 border-border/30 text-muted-foreground'
                    )}
                  >
                    {menu.menuName.replace(/^\d+\.\s*/, '')}
                  </span>
                );
              })}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Actions',
      className: 'w-32 text-right',
      cell: (role) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onViewRoleDetail(role)}
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

          {!role.isSystemRole && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDelete(role.name)}
              className="h-8 w-8 p-0 cursor-pointer text-destructive hover:bg-destructive/10"
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
    <DataTable
      columns={columns}
      data={roles}
      getRowId={(role) => role.id || role.name}
      searchKey="name"
      searchPlaceholder="Cari master role berdasarkan nama..."
    />
  );
}
