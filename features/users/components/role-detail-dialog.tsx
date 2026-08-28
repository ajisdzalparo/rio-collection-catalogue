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
import { ShieldCheck, KeyRound, Check, X, Edit, FolderTree } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '../types/roles.types';
import { PERMISSION_TREE } from '../data/permission-tree';

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

  let activeCount = 0;
  PERMISSION_TREE.forEach((menu) => {
    menu.actions.forEach((act) => {
      if (role.permissions && role.permissions[act.key]) {
        activeCount += 1;
      }
    });
  });

  const isFullAccess = activeCount >= totalActionsCount || role.name === 'Admin';

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
            <Badge variant={isFullAccess ? 'default' : 'secondary'} className="text-xs font-bold">
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
              const activeMenuActions = menu.actions.filter(
                (act) => isFullAccess || (role.permissions && role.permissions[act.key])
              ).length;

              const isMenuAllowed = activeMenuActions > 0;

              return (
                <div
                  key={menu.id}
                  className={cn(
                    'border rounded-2xl p-4 transition-all',
                    isMenuAllowed
                      ? 'border-border/40 bg-card'
                      : 'border-border/20 bg-muted/10 opacity-70'
                  )}
                >
                  <div className="flex items-center justify-between border-b border-border/20 pb-2 mb-2.5">
                    <div>
                      <span className="font-bold text-xs text-foreground block">
                        {menu.menuName}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {menu.description}
                      </span>
                    </div>

                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                        activeMenuActions === menu.actions.length
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : activeMenuActions > 0
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          : 'bg-muted text-muted-foreground border-border/30'
                      )}
                    >
                      {activeMenuActions} / {menu.actions.length} Aktif
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {menu.actions.map((action) => {
                      const isAllowed = isFullAccess || !!(role.permissions && role.permissions[action.key]);

                      return (
                        <div
                          key={action.key}
                          className={cn(
                            'flex items-center justify-between p-2 rounded-xl border text-xs',
                            isAllowed
                              ? 'border-emerald-500/30 bg-emerald-500/5 text-foreground'
                              : 'border-border/20 bg-muted/20 text-muted-foreground'
                          )}
                        >
                          <div className="flex flex-col pr-2">
                            <span className="font-semibold text-[11px]">{action.label}</span>
                            <span className="text-[10px] text-muted-foreground line-clamp-1">
                              {action.description}
                            </span>
                          </div>

                          <div
                            className={cn(
                              'h-4 w-4 rounded flex items-center justify-center shrink-0 ml-1',
                              isAllowed
                                ? 'bg-emerald-500 text-white'
                                : 'bg-muted text-muted-foreground border border-border/40'
                            )}
                          >
                            {isAllowed ? (
                              <Check className="h-2.5 w-2.5 stroke-3" />
                            ) : (
                              <X className="h-2.5 w-2.5 stroke-3" />
                            )}
                          </div>
                        </div>
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
              <Edit className="h-3.5 w-3.5" />
              <span>Edit Master Role</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
