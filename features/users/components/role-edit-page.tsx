'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useRbacStore } from '../hooks/use-rbac';
import { useRoleMutations } from '../hooks/use-role-mutations';
import type { UserRole } from '../types/roles.types';
import { RolePermissionForm, type RoleFormValues } from './role-permission-form';
import { isSuperAdminRole } from '@/lib/auth/roles';

interface RoleEditPageProps {
  roleName: string;
}

export function RoleEditPage({ roleName }: RoleEditPageProps) {
  const router = useRouter();
  const { roles } = useRbacStore();
  const { update } = useRoleMutations();

  const currentRole = useMemo<UserRole | undefined>(
    () => roles.find((role) => role.name.toLowerCase() === roleName.toLowerCase()),
    [roleName, roles]
  );

  const handleSubmit = async ({ name, description, permissions }: RoleFormValues) => {
    if (!currentRole) return;
    if (!currentRole.id) return;

    await update.mutateAsync({ id: currentRole.id, payload: { name, description, permissions } });
    toast.success(`Master role "${name}" berhasil diperbarui.`);
    router.push('/users?tab=rbac');
  };

  if (!currentRole) {
    return (
      <div className="space-y-6 pb-12">
        <Link href="/users?tab=rbac" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Master Roles
        </Link>
        <section className="rounded-2xl border border-border/40 bg-card p-8 text-center shadow-xs">
          <KeyRound className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground">Master Role Tidak Ditemukan</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Role “{roleName}” tidak ada atau telah dihapus dari sistem.
          </p>
          <Button onClick={() => router.push('/users?tab=rbac')} className="mt-5 rounded-xl">
            Lihat Semua Master Role
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Link href={`/users/roles/${encodeURIComponent(currentRole.name)}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Detail Role
          </Link>
          <div>
            <div className="mb-2 flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-[0.18em]">Role & Permissions</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Edit Master Role</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Ubah nama dan atur struktur tree hak akses (permissions) per menu dan aksi untuk role ini.
            </p>
          </div>
        </div>
        <div className="rounded-full border border-border/40 bg-muted/30 px-3 py-1.5 text-xs font-bold text-muted-foreground">
          Mengedit: <span className="text-foreground">{currentRole.name}</span>
        </div>
      </div>

      <section className="rounded-2xl border border-border/40 bg-card p-4 shadow-xs sm:p-6">
        {isSuperAdminRole(currentRole.name) ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
            <h2 className="text-base font-bold text-foreground">Super Admin selalu full access</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Role sistem ini dikunci agar akun Super Admin tidak kehilangan akses platform.
            </p>
            <Button onClick={() => router.push('/users?tab=rbac')} className="mt-4 rounded-xl">
              Kembali ke Master Roles
            </Button>
          </div>
        ) : (
          <RolePermissionForm
            key={currentRole.name}
            roleToEdit={currentRole}
            onSubmit={handleSubmit}
            isSubmitting={update.isPending}
            onCancel={() => router.push('/users?tab=rbac')}
          />
        )}
      </section>
    </div>
  );
}
