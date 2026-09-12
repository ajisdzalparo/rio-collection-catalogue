'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, ShieldCheck, FolderTree } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RolePermissions, UserRole } from '../types/roles.types';
import { useRbacStore, syncRolePermissions } from '../hooks/use-rbac';
import { PERMISSION_TREE, DEFAULT_ADMIN_PERMISSIONS } from '../data/permission-tree';

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleToEdit?: UserRole | null;
}

export function RoleFormDialog({ open, onOpenChange, roleToEdit }: RoleFormDialogProps) {
  const isEditing = !!roleToEdit;
  const { addRole, updateRole } = useRbacStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<RolePermissions>(DEFAULT_ADMIN_PERMISSIONS);

  const [prevRoleToEdit, setPrevRoleToEdit] = useState<UserRole | null | undefined>(roleToEdit);
  const [prevOpen, setPrevOpen] = useState(open);

  if (roleToEdit !== prevRoleToEdit || open !== prevOpen) {
    setPrevRoleToEdit(roleToEdit);
    setPrevOpen(open);
    if (roleToEdit) {
      setName(roleToEdit.name);
      setDescription(roleToEdit.description || '');
      setPermissions(syncRolePermissions(roleToEdit.permissions, roleToEdit.name));
    } else {
      setName('');
      setDescription('');
      setPermissions(DEFAULT_ADMIN_PERMISSIONS);
    }
  }

  const togglePermission = (key: string) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleMenuAll = (menuId: string) => {
    const targetMenu = PERMISSION_TREE.find((m) => m.id === menuId);
    if (!targetMenu) return;

    const allChecked = targetMenu.actions.every((act) => permissions[act.key]);
    const nextPerms = { ...permissions };

    targetMenu.actions.forEach((act) => {
      nextPerms[act.key] = !allChecked;
    });

    setPermissions(nextPerms);
  };

  const handleSelectAll = () => {
    const allPerms: RolePermissions = {};
    PERMISSION_TREE.forEach((menu) => {
      menu.actions.forEach((act) => {
        allPerms[act.key] = true;
      });
    });
    setPermissions(allPerms);
  };

  const handleDeselectAll = () => {
    setPermissions({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing && roleToEdit) {
      updateRole(roleToEdit.name, {
        name: name.trim(),
        description: description.trim(),
        permissions
      });
    } else {
      addRole({
        name: name.trim(),
        description: description.trim(),
        permissions
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-foreground" />
            {isEditing ? 'Edit Master Role' : 'Tambah Master Role Baru'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Ubah nama dan atur struktur tree hak akses (permissions) per menu dan aksi.'
              : 'Buat role baru dan atur struktur tree kustom hak akses menu & action.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden pt-2">
          {/* Static inputs block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-border/20 shrink-0">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Nama Master Role *
              </label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Admin Stok, Admin CS, Sales Manager"
                className="rounded-xl font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Deskripsi Role (Opsional)
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Bertanggung jawab mengelola pesanan & produk"
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Scrollable checklist block */}
          <div className="flex-1 overflow-y-auto pr-1 pb-4 space-y-3">
            <div className="flex items-center justify-between sticky top-0 bg-background py-2.5 z-10 border-b border-border/10">
              <div className="flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-primary" />
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Tree Hak Akses (Menu & Action)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] font-semibold text-foreground hover:underline cursor-pointer"
                >
                  Pilih Semua Tree
                </button>
                <span className="text-muted-foreground text-xs">•</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
                >
                  Reset Semua
                </button>
              </div>
            </div>

            {/* Tree Nodes List */}
            <div className="space-y-4 pt-1">
              {PERMISSION_TREE.map((menu) => {
                const activeActionCount = menu.actions.filter((act) => permissions[act.key]).length;
                const isFullyChecked = activeActionCount === menu.actions.length;
                const isPartiallyChecked = activeActionCount > 0 && !isFullyChecked;

                return (
                  <div
                    key={menu.id}
                    className="border border-border/40 rounded-xl p-3.5 bg-card/60 space-y-3 shadow-2xs"
                  >
                    {/* Menu Header (Parent Node) */}
                    <div className="flex items-center justify-between border-b border-border/20 pb-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">
                            {menu.menuName.replace(/^\d+\.\s*/, '')}
                          </span>
                          <span
                            className={cn(
                              'text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border',
                              isFullyChecked
                                ? 'bg-zinc-900/10 text-zinc-800 border-zinc-900/20 dark:bg-zinc-100/10 dark:text-zinc-200 dark:border-zinc-100/20'
                                : isPartiallyChecked
                                ? 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20 dark:text-zinc-400'
                                : 'bg-muted text-muted-foreground border-border/40'
                            )}
                          >
                            {activeActionCount} / {menu.actions.length} Akses Aktif
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{menu.description}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleMenuAll(menu.id)}
                        className="text-[11px] font-bold text-primary hover:underline shrink-0 ml-2 cursor-pointer"
                      >
                        {isFullyChecked ? 'Kosongkan' : 'Pilih Semua'}
                      </button>
                    </div>

                    {/* Actions List (Child Nodes) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {menu.actions.map((action) => {
                        const isChecked = !!permissions[action.key];
                        return (
                          <button
                            key={action.key}
                            type="button"
                            onClick={() => togglePermission(action.key)}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left cursor-pointer transition-all hover:bg-muted/50 group',
                              isChecked
                                ? 'border-zinc-900/20 bg-zinc-900/5 text-foreground dark:border-zinc-100/20 dark:bg-zinc-100/5'
                                : 'border-border/30 bg-card text-muted-foreground'
                            )}
                          >
                            <div
                              className={cn(
                                'h-4.5 w-4.5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all',
                                isChecked
                                  ? 'bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-900'
                                  : 'border-border/60 bg-transparent group-hover:border-foreground/50'
                              )}
                            >
                              {isChecked && <Check className="h-3 w-3 stroke-3" />}
                            </div>

                            <div className="flex flex-col flex-1 min-w-0 pr-1">
                              <span className={cn('text-xs font-bold transition-colors line-clamp-1', isChecked ? 'text-foreground' : 'text-zinc-655 dark:text-zinc-455')}>
                                {action.label}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-normal line-clamp-1 leading-normal">
                                {action.description}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Static footer block */}
          <DialogFooter className="pt-4 border-t border-border/20 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button type="submit" className="rounded-xl font-bold">
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
