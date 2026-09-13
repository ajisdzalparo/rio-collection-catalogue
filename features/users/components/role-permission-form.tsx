'use client';

import { useState, type FormEvent } from 'react';
import { Check, FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { RolePermissions, UserRole } from '../types/roles.types';
import { DEFAULT_ADMIN_PERMISSIONS, PERMISSION_TREE } from '../data/permission-tree';
import { syncRolePermissions } from '../hooks/use-rbac';

export interface RoleFormValues {
  name: string;
  description: string;
  permissions: RolePermissions;
}

interface RolePermissionFormProps {
  roleToEdit?: UserRole | null;
  onSubmit: (values: RoleFormValues) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  className?: string;
  isSubmitting?: boolean;
}

export function RolePermissionForm({
  roleToEdit,
  onSubmit,
  onCancel,
  submitLabel = 'Simpan',
  cancelLabel = 'Batal',
  className,
  isSubmitting = false
}: RolePermissionFormProps) {
  const [name, setName] = useState(roleToEdit?.name || '');
  const [description, setDescription] = useState(roleToEdit?.description || '');
  const [permissions, setPermissions] = useState<RolePermissions>(() =>
    roleToEdit
      ? syncRolePermissions(roleToEdit.permissions, roleToEdit.name)
      : { ...DEFAULT_ADMIN_PERMISSIONS }
  );

  const togglePermission = (key: string) => {
    setPermissions((current) => ({
      ...current,
      [key]: !current[key]
    }));
  };

  const toggleMenuAll = (menuId: string) => {
    const menu = PERMISSION_TREE.find((item) => item.id === menuId);
    if (!menu) return;

    const isFullyChecked = menu.actions.every((action) => permissions[action.key]);
    setPermissions((current) => {
      const next = { ...current };
      menu.actions.forEach((action) => {
        next[action.key] = !isFullyChecked;
      });
      return next;
    });
  };

  const handleSelectAll = () => {
    const allPermissions: RolePermissions = {};
    PERMISSION_TREE.forEach((menu) => {
      menu.actions.forEach((action) => {
        allPermissions[action.key] = true;
      });
    });
    setPermissions(allPermissions);
  };

  const handleDeselectAll = () => setPermissions({});

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    await onSubmit({
      name: trimmedName,
      description: description.trim(),
      permissions
    });
  };

  return (
    <form onSubmit={handleSubmit} className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div className="grid shrink-0 grid-cols-1 gap-4 border-b border-border/20 pb-4 sm:grid-cols-2">
        <div>
          <label htmlFor="role-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Nama Master Role *
          </label>
          <Input
            id="role-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Contoh: Admin Stok, Admin CS, Sales Manager"
            className="rounded-xl font-semibold"
          />
        </div>

        <div>
          <label htmlFor="role-description" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Deskripsi Role (Opsional)
          </label>
          <Input
            id="role-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Contoh: Bertanggung jawab mengelola pesanan & produk"
            className="rounded-xl text-xs"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto py-4 pr-1">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/10 bg-background py-2.5">
          <div className="flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Tree Hak Akses (Menu & Action)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={handleSelectAll} className="cursor-pointer text-[11px] font-semibold text-foreground hover:underline">
              Pilih Semua Tree
            </button>
            <span className="text-xs text-muted-foreground">•</span>
            <button type="button" onClick={handleDeselectAll} className="cursor-pointer text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:underline">
              Reset Semua
            </button>
          </div>
        </div>

        <div className="space-y-4 pt-1">
          {PERMISSION_TREE.map((menu) => {
            const activeActionCount = menu.actions.filter((action) => permissions[action.key]).length;
            const isFullyChecked = activeActionCount === menu.actions.length;
            const isPartiallyChecked = activeActionCount > 0 && !isFullyChecked;

            return (
              <section key={menu.id} className="space-y-3 rounded-xl border border-border/40 bg-card/60 p-3.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-border/20 pb-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-bold text-foreground">{menu.menuName.replace(/^\d+\.\s*/, '')}</h2>
                      <span className={cn(
                        'rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase',
                        isFullyChecked
                          ? 'border-zinc-900/20 bg-zinc-900/10 text-zinc-800 dark:border-zinc-100/20 dark:bg-zinc-100/10 dark:text-zinc-200'
                          : isPartiallyChecked
                            ? 'border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                            : 'border-border/40 bg-muted text-muted-foreground'
                      )}>
                        {activeActionCount} / {menu.actions.length} Akses Aktif
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{menu.description}</p>
                  </div>

                  <button type="button" onClick={() => toggleMenuAll(menu.id)} className="ml-2 shrink-0 cursor-pointer text-[11px] font-bold text-primary hover:underline">
                    {isFullyChecked ? 'Kosongkan' : 'Pilih Semua'}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                  {menu.actions.map((action) => {
                    const isChecked = Boolean(permissions[action.key]);
                    return (
                      <button
                        key={action.key}
                        type="button"
                        role="checkbox"
                        aria-checked={isChecked}
                        onClick={() => togglePermission(action.key)}
                        className={cn(
                          'group flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all hover:bg-muted/50',
                          isChecked
                            ? 'border-zinc-900/20 bg-zinc-900/5 text-foreground dark:border-zinc-100/20 dark:bg-zinc-100/5'
                            : 'border-border/30 bg-card text-muted-foreground'
                        )}
                      >
                        <span className={cn(
                          'mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition-all',
                          isChecked
                            ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                            : 'border-border/60 bg-transparent group-hover:border-foreground/50'
                        )}>
                          {isChecked && <Check className="h-3 w-3 stroke-3" />}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col pr-1">
                          <span className={cn('line-clamp-1 text-xs font-bold', isChecked ? 'text-foreground' : 'text-muted-foreground')}>
                            {action.label}
                          </span>
                          <span className="line-clamp-1 text-[10px] font-normal leading-normal text-muted-foreground">
                            {action.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-2 border-t border-border/20 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
            {cancelLabel}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="rounded-xl font-bold">
          {isSubmitting ? 'Menyimpan...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
