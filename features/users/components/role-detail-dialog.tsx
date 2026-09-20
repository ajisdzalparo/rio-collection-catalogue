'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, KeyRound, Pencil, FolderTree } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '../types/roles.types';
import { PERMISSION_TREE } from '../data/permission-tree';
import { syncRolePermissions } from '../hooks/use-rbac';

interface RoleDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: UserRole | null;
  onEditRole?: (role: UserRole) => void;
}

export function RoleDetailDialog({
  open,
  onOpenChange,
  role,
  onEditRole
}: RoleDetailDialogProps) {
  if (!role) return null;

  const totalActionsCount = PERMISSION_TREE.reduce(
    (acc, menu) => acc + menu.actions.length,
    0
  );

  const syncedPerms = syncRolePermissions(role.permissions, role.name);

  const activeCount = PERMISSION_TREE.reduce(
    (acc, menu) =>
      acc +
      menu.actions.filter((act) => syncedPerms[act.key]).length,
    0
  );

  const isFullAccess = activeCount >= totalActionsCount;

  const handleEditClick = () => {
    onOpenChange(false);
    if (onEditRole) {
      onEditRole(role);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0 pb-2 border-b border-border/20">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="h-5 w-5 text-primary" />
              <span>Detail Master Role: {role.name}</span>
            </DialogTitle>

            {role.isSystemRole ? (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-md border border-border/40">
                System Role
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20">
                Master Custom
              </span>
            )}
          </div>
          <DialogDescription className="text-xs mt-1">
            {role.description || 'Rincian hak akses menu dan tindakan untuk master role ini.'}
          </DialogDescription>

          <div className="flex items-center gap-3 pt-2">
            <Badge variant="outline" className={cn('text-xs font-bold', activeCount > 0 && 'border-zinc-900/20 bg-zinc-900/10 text-zinc-800 dark:border-zinc-100/20 dark:bg-zinc-100/10 dark:text-zinc-200')}>
              <ShieldCheck className="h-3.5 w-3.5 mr-1 inline" />
              {isFullAccess ? 'Akses Penuh Seluruh Sistem' : `${activeCount} / ${totalActionsCount} Akses Aktif`}
            </Badge>

            <span className="text-xs text-muted-foreground">
              {activeCount} Diizinkan • {totalActionsCount - activeCount} Dibatasi
            </span>
          </div>
        </DialogHeader>

        {/* Permission Tree Content */}
        <div className="space-y-4 py-3 overflow-y-auto pr-1 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <FolderTree className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Rincian Hak Akses per Menu & Actions
            </h4>
          </div>

          <div className="space-y-3">
            {PERMISSION_TREE.map((menu) => {
              const activeCountInMenu = menu.actions.filter(
                (act) => syncedPerms[act.key]
              ).length;

              const isFullyActive = activeCountInMenu === menu.actions.length;
              const isPartiallyActive = activeCountInMenu > 0 && !isFullyActive;

              return (
                <div
                  key={menu.id}
                  className="border border-border/40 rounded-xl p-3 bg-card/60 space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-1.5 border-b border-border/20 pb-2">
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs text-foreground block">
                        {menu.menuName.replace(/^\d+\.\s*/, '')}
                      </span>
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        {menu.description}
                      </p>
                    </div>

                    <span
                      className={cn(
                        'text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border shrink-0',
                        isFullyActive
                          ? 'bg-zinc-900/10 text-zinc-800 border-zinc-900/20 dark:bg-zinc-100/10 dark:text-zinc-200 dark:border-zinc-100/20'
                          : isPartiallyActive
                          ? 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20 dark:text-zinc-400'
                          : 'bg-muted text-muted-foreground border-border/40'
                      )}
                    >
                      {activeCountInMenu} / {menu.actions.length} Aktif
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {menu.actions.map((action) => {
                      const isAllowed = !!syncedPerms[action.key];

                      return (
                        <span
                          key={action.key}
                          className={cn(
                            'text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all flex items-center gap-1.5',
                            isAllowed
                              ? 'bg-zinc-900/10 text-zinc-800 dark:text-zinc-200 border-zinc-900/20 dark:bg-zinc-100/10 dark:border-zinc-100/20'
                              : 'bg-zinc-100 text-zinc-400 border-zinc-200 dark:bg-zinc-900/50 dark:border-zinc-800 dark:text-zinc-500'
                          )}
                        >
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full shrink-0',
                              isAllowed
                                ? 'bg-zinc-900 dark:bg-zinc-100'
                                : 'bg-zinc-300 dark:bg-zinc-700'
                            )}
                          />
                          {action.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-border/20 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs"
          >
            Tutup
          </Button>

          {onEditRole && (
            <Button
              type="button"
              onClick={handleEditClick}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit Master Role</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
