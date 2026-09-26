'use client';

import React, { useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  KeyRound,
  ShieldCheck,
    Pencil,
  FolderTree,
  CheckCircle2,
  XCircle,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRolesQuery, syncRolePermissions } from '@/features/users/hooks/use-rbac';
import { useRoleMutations } from '@/features/users/hooks/use-role-mutations';
import { PERMISSION_TREE } from '@/features/users/data/permission-tree';
import { isSuperAdminRole } from '@/lib/auth/roles';

interface RoleDetailPageProps {
  params: Promise<{ roleName: string }>;
}

export default function RoleDetailPage({ params }: RoleDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const rawRoleName = decodeURIComponent(resolvedParams.roleName || '');

  const { data: roles = [], isLoading } = useRolesQuery();
  const { update } = useRoleMutations();

  // Match role case-insensitively
  const currentRole = useMemo(() => {
    return roles.find(
      (r) => r.name.toLowerCase() === rawRoleName.toLowerCase()
    );
  }, [roles, rawRoleName]);

  const totalActionsCount = useMemo(() => {
    return PERMISSION_TREE.reduce((acc, menu) => acc + menu.actions.length, 0);
  }, []);

  const syncedPerms = useMemo(() => {
    if (!currentRole) return {};
    return syncRolePermissions(currentRole.permissions, currentRole.name);
  }, [currentRole]);

  const activeCount = useMemo(() => {
    return PERMISSION_TREE.reduce(
      (acc, menu) => acc + menu.actions.filter((act) => syncedPerms[act.key]).length,
      0
    );
  }, [syncedPerms]);

  const isProtectedSystemRole = useMemo(() => {
    return isSuperAdminRole(currentRole?.name);
  }, [currentRole]);

  const isFullAccess = activeCount >= totalActionsCount;

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-56 w-full rounded-xl" /><Skeleton className="h-72 w-full rounded-xl" /></div>;

  if (!currentRole) {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex items-center gap-2">
          <Link
            href="/manajemen-pengguna/role"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Master Roles</span>
          </Link>
        </div>

        <div className="p-8 text-center bg-card border border-border/40 rounded-xl space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Master Role Tidak Ditemukan</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Role &ldquo;{rawRoleName}&rdquo; tidak ada atau telah dihapus dari sistem.
          </p>
          <div className="pt-2">
            <Button
              onClick={() => router.push('/manajemen-pengguna/role')}
              className="rounded-lg text-xs font-bold cursor-pointer"
            >
              Lihat Semua Master Role
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Back Navigation & Breadcrumb */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link href="/manajemen-pengguna/role">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl cursor-pointer"
            title="Kembali ke Master Roles"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push(`/users/roles/${encodeURIComponent(currentRole.name)}/edit`)}
            disabled={isProtectedSystemRole}
            className="gap-1.5 h-9 rounded-lg text-xs font-bold cursor-pointer bg-foreground text-background hover:bg-foreground/90 shadow-xs"
            title={isProtectedSystemRole ? 'Super Admin selalu full access' : 'Edit Role & Permissions'}
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Edit</span>
          </Button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-card border border-border/40 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <KeyRound className="h-5 w-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
                {currentRole.name}
              </h1>
              {isProtectedSystemRole ? (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 px-2.5 py-1 rounded-full shadow-2xs flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Role Sistem Utama
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                  Master Role Kustom
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {currentRole.description || 'Tidak ada deskripsi tambahan untuk master role ini.'}
            </p>
          </div>

          {/* Status Toggle on Header */}
          <div className="flex items-center justify-between sm:justify-start gap-4 bg-muted/20 border border-border/30 rounded-lg p-4 w-full sm:w-auto shrink-0">
            <div className="space-y-0.5 text-left sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Status Role
              </span>
              <span className="text-xs sm:text-sm font-bold text-foreground">
                {currentRole.isActive !== false ? 'Aktif Digunakan' : 'Non-aktif'}
              </span>
            </div>
            <Switch
              checked={currentRole.isActive !== false}
              disabled={isProtectedSystemRole || update.isPending || !currentRole.id}
              onCheckedChange={(checked) => {
                if (!currentRole.id) return;
                void update.mutateAsync({ id: currentRole.id, payload: { isActive: checked } })
                  .catch(() => toast.error('Gagal mengubah status role.'));
              }}
            />
          </div>
        </div>

        {/* Permission Overview Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/20">
          <div className="bg-muted/20 border border-border/30 rounded-lg p-4 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Tingkat Otorisasi
            </span>
            <p className="text-sm font-bold text-foreground">
              {isFullAccess ? 'Akses Penuh Seluruh Menu' : 'Akses Terbatas (Kustom)'}
            </p>
          </div>

          <div className="bg-muted/20 border border-border/30 rounded-lg p-4 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Total Izin Diaktifkan
            </span>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
              {activeCount} dari {totalActionsCount} Hak Akses
            </p>
          </div>

          <div className="bg-muted/20 border border-border/30 rounded-lg p-4 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Hak Akses Dibatasi
            </span>
            <p className="text-sm font-bold text-muted-foreground tabular-nums">
              {totalActionsCount - activeCount} Tindakan Dibatasi
            </p>
          </div>
        </div>
      </div>

      {/* Permission Tree Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Rincian Hak Akses Menu & Tindakan
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {PERMISSION_TREE.length} Kategori Menu Sistem
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {PERMISSION_TREE.map((menu) => {
            const activeCountInMenu = menu.actions.filter(
              (act) => syncedPerms[act.key]
            ).length;

            const isFullyActive = activeCountInMenu === menu.actions.length;
            const isPartiallyActive = activeCountInMenu > 0 && !isFullyActive;

            return (
              <div
                key={menu.id}
                className="bg-card border border-border/40 rounded-xl p-5 space-y-4 shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Category Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-border/20 pb-3">
                    <div className="space-y-0.5">
                      <h3 className="font-bold text-sm text-foreground">
                        {menu.menuName}
                      </h3>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        {menu.description}
                      </p>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn('text-[10px] font-bold shrink-0', (isFullyActive || isPartiallyActive) && 'border-zinc-900/20 bg-zinc-900/10 text-zinc-800 dark:border-zinc-100/20 dark:bg-zinc-100/10 dark:text-zinc-200')}
                    >
                      {activeCountInMenu} / {menu.actions.length} Aktif
                    </Badge>
                  </div>

                  {/* Actions List in Category */}
                  <div className="space-y-2 pt-1">
                    {menu.actions.map((action) => {
                      const isAllowed = !!syncedPerms[action.key];

                      return (
                        <div
                          key={action.key}
                          className={cn(
                            'p-3 rounded-lg border text-xs flex items-start justify-between gap-3 transition-colors',
                            isAllowed
                              ? 'bg-zinc-900/5 border-zinc-900/20 text-foreground dark:bg-zinc-100/5 dark:border-zinc-100/20'
                              : 'bg-muted/10 border-border/20 text-muted-foreground'
                          )}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <span className="font-bold text-xs block text-foreground">
                              {action.label}
                            </span>
                            <p className="text-[11px] text-muted-foreground leading-normal">
                              {action.description}
                            </p>
                          </div>

                          <div className="shrink-0 pt-0.5">
                            {isAllowed ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-900/10 dark:bg-zinc-100/10 border border-zinc-900/20 dark:border-zinc-100/20 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="h-3 w-3" />
                                Diizinkan
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground/70 bg-muted/40 border border-border/30 px-2 py-0.5 rounded-full">
                                <XCircle className="h-3 w-3" />
                                Dibatasi
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
