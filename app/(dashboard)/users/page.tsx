'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import {
  UserTable,
  UserFormDialog,
  RoleFormDialog,
  RoleDetailDialog,
  RoleTable,
  useRbacStore,
  useRolesQuery,
  PERMISSION_TREE,
  type UserRole
} from '@/features/users';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import {
  Plus,
  KeyRound,
  Check,
  Edit,
  Trash2,
  LayoutGrid,
  List,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

function UsersPageContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'users';

  const tabInfo: Record<string, { title: string; desc: string }> = {
    users: {
      title: 'Daftar Pengguna / Admin',
      desc: 'Kelola akun administrator dan staff yang memiliki hak akses masuk ke dashboard CMS.'
    },
    rbac: {
      title: 'Master Roles & Permissions',
      desc: 'Kelola tingkat otorisasi, hak akses per menu, dan status aktif master role (RBAC) sistem.'
    }
  };

  const currentHeader = tabInfo[activeTab] || tabInfo.users;

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<UserRole | null>(null);
  const [roleToView, setRoleToView] = useState<UserRole | null>(null);
  const [deleteTargetRole, setDeleteTargetRole] = useState<string | null>(null);
  const [roleViewMode, setRoleViewMode] = useState<'table' | 'grid'>('table');

  const { data: mockRoles } = useRolesQuery();
  const { roles, updateRolePermissions, setRoles, deleteRole } = useRbacStore();

  useEffect(() => {
    if (mockRoles && mockRoles.length > 0 && roles.length <= 5) {
      setRoles(mockRoles);
    }
  }, [mockRoles, roles.length, setRoles]);


  const handlePermissionToggle = (roleName: string, permKey: string, currentVal: boolean) => {
    updateRolePermissions(roleName, { [permKey]: !currentVal });
  };

  const handleOpenAddRole = () => {
    setRoleToEdit(null);
    setShowRoleDialog(true);
  };

  const handleOpenEditRole = (role: UserRole) => {
    setRoleToEdit(role);
    setShowRoleDialog(true);
  };

  const handleOpenRoleDetail = (role: UserRole) => {
    setRoleToView(role);
    setShowDetailDialog(true);
  };

  const handleDeleteRole = (roleName: string) => {
    setDeleteTargetRole(roleName);
  };

  const confirmDeleteRole = () => {
    if (deleteTargetRole) {
      deleteRole(deleteTargetRole);
      setDeleteTargetRole(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={currentHeader.title}
        description={currentHeader.desc}
      >
        {activeTab === 'users' ? (
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="gap-2 rounded-xl cursor-pointer font-bold"
          >
            <Plus className="h-4 w-4" />
            <span>Add User</span>
          </Button>
        ) : (
          <Button
            onClick={handleOpenAddRole}
            className="gap-2 rounded-xl cursor-pointer font-bold bg-foreground text-background hover:bg-foreground/90"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Master Role</span>
          </Button>
        )}
      </PageHeader>

      {/* View Mode Bar (Only on RBAC) */}
      {activeTab === 'rbac' && (
        <div className="flex justify-end border-b border-border/20 pb-3">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1">
              Tampilan:
            </span>
            <button
              onClick={() => setRoleViewMode('table')}
              className={cn(
                'p-1.5 rounded-lg border transition-all cursor-pointer',
                roleViewMode === 'table'
                  ? 'bg-foreground text-background border-foreground shadow-2xs'
                  : 'bg-muted/40 text-muted-foreground border-border/30 hover:text-foreground'
              )}
              title="Tampilan Tabel (List Table)"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setRoleViewMode('grid')}
              className={cn(
                'p-1.5 rounded-lg border transition-all cursor-pointer',
                roleViewMode === 'grid'
                  ? 'bg-foreground text-background border-foreground shadow-2xs'
                  : 'bg-muted/40 text-muted-foreground border-border/30 hover:text-foreground'
              )}
              title="Tampilan Kartu (Grid Cards)"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Tab Panels */}
      {activeTab === 'users' ? (
        <Suspense
          fallback={
            <div className="h-32 flex items-center justify-center">Loading User Table...</div>
          }
        >
          <UserTable />
        </Suspense>
      ) : roleViewMode === 'table' ? (
        <RoleTable onEditRole={handleOpenEditRole} onViewRoleDetail={handleOpenRoleDetail} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <div
              key={role.name}
              className={cn(
                'bg-card border border-border/40 rounded-2xl p-5 space-y-4 hover:shadow-xs transition-all relative overflow-hidden flex flex-col justify-between',
                roleToEdit?.name === role.name && 'ring-2 ring-foreground/20 bg-muted/5'
              )}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-border/20 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-muted-foreground" />
                      <span className="font-extrabold text-sm tracking-wide text-foreground uppercase">
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
                      <p className="text-xs text-muted-foreground mt-1 leading-snug">
                        {role.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenRoleDetail(role)}
                      className="h-7 w-7 p-0 cursor-pointer"
                      title="Lihat Detail Role"
                    >
                      <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEditRole(role)}
                      className="h-7 w-7 p-0 cursor-pointer"
                      title="Edit Master Role"
                    >
                      <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </Button>

                    {!role.isSystemRole && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRole(role.name)}
                        className="h-7 w-7 p-0 cursor-pointer text-destructive hover:bg-destructive/10"
                        title="Hapus Role"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Permissions Tree on Role Cards */}
                <div className="space-y-3 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Hak Akses Menu & Actions:
                  </span>

                  <div className="space-y-2.5 max-h-75 overflow-y-auto pr-1">
                    {PERMISSION_TREE.map((menu) => {
                      const activeCount = menu.actions.filter(
                        (act) => role.permissions && role.permissions[act.key]
                      ).length;
                      return (
                        <div
                          key={menu.id}
                          className="p-3 rounded-xl border border-border/30 bg-muted/10 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between font-bold text-foreground">
                            <span>{menu.menuName}</span>
                            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border/40">
                              {activeCount} / {menu.actions.length} Akses
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 border-t border-border/20">
                            {menu.actions.map((act) => {
                              const isAllowed = !!(role.permissions && role.permissions[act.key]);
                              return (
                                <button
                                  key={act.key}
                                  type="button"
                                  onClick={() =>
                                    handlePermissionToggle(role.name, act.key, isAllowed)
                                  }
                                  className={cn(
                                    'flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition-all',
                                    isAllowed
                                      ? 'border-foreground/30 bg-foreground/5 font-semibold text-foreground'
                                      : 'border-border/20 bg-transparent text-muted-foreground hover:text-foreground'
                                  )}
                                >
                                  <span className="text-[11px] truncate">{act.label}</span>
                                  <div
                                    className={cn(
                                      'h-3.5 w-3.5 rounded flex items-center justify-center shrink-0 ml-1.5',
                                      isAllowed
                                        ? 'bg-foreground text-background'
                                        : 'border border-border/60'
                                    )}
                                  >
                                    {isAllowed && <Check className="h-2.5 w-2.5 stroke-3" />}
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
              </div>
            </div>
          ))}
        </div>
      )}

      <UserFormDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      <RoleFormDialog
        open={showRoleDialog}
        onOpenChange={setShowRoleDialog}
        roleToEdit={roleToEdit}
      />
      <RoleDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        role={roleToView}
        onEditRole={handleOpenEditRole}
      />
      <ConfirmModal
        open={Boolean(deleteTargetRole)}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetRole(null);
        }}
        title="Konfirmasi Hapus Role"
        description={
          deleteTargetRole
            ? `Apakah Anda yakin ingin menghapus master role "${deleteTargetRole}"?`
            : ''
        }
        confirmText="Hapus Role"
        cancelText="Batal"
        variant="destructive"
        onConfirm={confirmDeleteRole}
      />
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-foreground" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading access control panel...
          </p>
        </div>
      }
    >
      <UsersPageContent />
    </Suspense>
  );
}
