'use client';

import React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '@/hooks/use-auth';
import { isSuperAdminRole, normalizeRoleName } from '@/lib/auth/roles';
import type { RolePermissions, UserRole } from '../types/roles.types';
import { PERMISSION_TREE } from '../data/permission-tree';

interface RbacState {
  roles: UserRole[];
  activeRoleName: string;
  setRoles: (roles: UserRole[]) => void;
  setActiveRole: (roleName: string) => void;
  updateRolePermissions: (roleName: string, permissions: Partial<RolePermissions>) => void;
  addRole: (newRole: { name: string; description?: string; permissions: RolePermissions; isActive?: boolean }) => void;
  updateRole: (
    targetRoleName: string,
    updated: { name?: string; description?: string; permissions?: Partial<RolePermissions>; isActive?: boolean }
  ) => void;
  deleteRole: (roleName: string) => void;
}

const DEFAULT_ROLES: UserRole[] = [
  {
    name: 'Super Admin',
    description: 'Akses tertinggi ke seluruh sistem, manajemen akun, dan konfigurasi master role',
    isSystemRole: true,
    isActive: true,
    permissions: {
      'activity.view': true,
      viewOverview: true,
      manageOrders: true,
      manageProducts: true,
      manageJournal: true,
      manageSettings: true,
      viewReports: true
    }
  },
  {
    name: 'Owner',
    description: 'Pemilik toko dengan akses penuh operasional tanpa akses finance platform Super Admin',
    isSystemRole: true,
    isActive: true,
    permissions: {
      'activity.view': true,
      viewOverview: true,
      manageOrders: true,
      manageProducts: true,
      manageJournal: true,
      manageSettings: true,
      viewReports: true
    }
  },
  {
    name: 'Admin',
    description: 'Akses penuh ke seluruh sistem dan operasional manajemen',
    isSystemRole: true,
    isActive: true,
    permissions: {
      viewOverview: true,
      manageOrders: true,
      manageProducts: true,
      manageJournal: true,
      manageSettings: true,
      viewReports: true
    }
  },
  {
    name: 'Developer',
    description: 'Akses penuh teknikal dan debug sistem',
    isSystemRole: false,
    isActive: true,
    permissions: {
      viewOverview: true,
      manageOrders: true,
      manageProducts: true,
      manageJournal: true,
      manageSettings: true,
      viewReports: true
    }
  },
  {
    name: 'Manager',
    description: 'Pengelola operasional toko dan laporan harian',
    isSystemRole: false,
    isActive: true,
    permissions: {
      viewOverview: true,
      manageOrders: true,
      manageProducts: true,
      manageJournal: true,
      manageSettings: false,
      viewReports: true
    }
  },
  {
    name: 'Sales',
    description: 'Pengelola transaksi dan pesanan pelanggan',
    isSystemRole: false,
    isActive: true,
    permissions: {
      viewOverview: true,
      manageOrders: true,
      manageProducts: false,
      manageJournal: false,
      manageSettings: false,
      viewReports: false
    }
  },
  {
    name: 'Designer',
    description: 'Pengelola konten produk dan artikel blog',
    isSystemRole: false,
    isActive: true,
    permissions: {
      viewOverview: true,
      manageOrders: false,
      manageProducts: true,
      manageJournal: true,
      manageSettings: false,
      viewReports: false
    }
  }
];

const REQUIRED_ROLE_NAMES = ['Super Admin', 'Owner', 'Admin', 'Developer'] as const;

function ensureRequiredRoles(roles: UserRole[]): UserRole[] {
  const rolesByName = new Map(roles.map((role) => [normalizeRoleName(role.name), role]));
  const requiredRoles = REQUIRED_ROLE_NAMES.map((roleName) => {
    return rolesByName.get(normalizeRoleName(roleName)) ||
      DEFAULT_ROLES.find((role) => normalizeRoleName(role.name) === normalizeRoleName(roleName));
  }).filter((role): role is UserRole => Boolean(role));

  const requiredRoleKeys = new Set(REQUIRED_ROLE_NAMES.map((roleName) => normalizeRoleName(roleName)));
  const customRoles = roles.filter((role) => !requiredRoleKeys.has(normalizeRoleName(role.name)));
  return [...requiredRoles, ...customRoles];
}

export const useRbacStore = create<RbacState>()(
  persist(
    (set) => ({
      roles: DEFAULT_ROLES,
      activeRoleName: 'Super Admin',
      setRoles: (roles) => set({ roles: ensureRequiredRoles(roles) }),
      setActiveRole: (roleName) => set({ activeRoleName: roleName }),
      updateRolePermissions: (roleName, updatedPerms) =>
        set((state) => ({
          roles: state.roles.map((r) =>
            r.name === roleName ? { ...r, permissions: { ...r.permissions, ...updatedPerms } } : r
          )
        })),
      addRole: (newRole) =>
        set((state) => {
          if (state.roles.some((r) => r.name.toLowerCase() === newRole.name.toLowerCase()))
            return {};
          return {
            roles: [
              ...state.roles,
              {
                name: newRole.name,
                description: newRole.description || 'Master role kustom',
                isSystemRole: false,
                permissions: newRole.permissions,
                isActive: newRole.isActive ?? true
              }
            ]
          };
        }),
      updateRole: (targetRoleName, updated) =>
        set((state) => {
          if (isSuperAdminRole(targetRoleName)) return state;

          return {
            roles: state.roles.map((r) =>
              r.name === targetRoleName
                ? {
                    ...r,
                    name: updated.name || r.name,
                    description:
                      updated.description !== undefined ? updated.description : r.description,
                    isActive:
                      updated.isActive !== undefined ? updated.isActive : (r.isActive ?? true),
                    permissions: updated.permissions
                      ? { ...r.permissions, ...updated.permissions }
                      : r.permissions
                  }
                : r
            ),
            activeRoleName:
              state.activeRoleName === targetRoleName && updated.name
                ? updated.name
                : state.activeRoleName
          };
        }),
      deleteRole: (roleName) =>
        set((state) => {
          const lower = normalizeRoleName(roleName);
          if (isSuperAdminRole(roleName)) return state;
          const filtered = state.roles.filter((r) => r.name.toLowerCase() !== lower);
          return {
            roles: filtered,
            activeRoleName: normalizeRoleName(state.activeRoleName) === lower ? 'Super Admin' : state.activeRoleName
          };
        })
    }),
    {
      name: 'rio-rbac-store',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<RbacState>;
        const persistedRoles = Array.isArray(persisted.roles) ? persisted.roles : currentState.roles;
        return {
          ...currentState,
          ...persisted,
          roles: ensureRequiredRoles(persistedRoles)
        };
      }
    }
  )
);

// React Query hook to fetch roles from native backend API
export function useRolesQuery() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/roles');
      if (data.code === 200 && data.data) {
        return data.data as UserRole[];
      }
      return Array.isArray(data) ? data : [];
    }
  });
}

export function useRbac() {
  const { roles } = useRbacStore();
  const { user, isLoading: isAuthLoading } = useAuth();
  const authenticatedRoleName = user?.role || '';
  const currentRoleName = isAuthLoading ? '' : authenticatedRoleName;
  const currentRole =
    roles.find((r) => normalizeRoleName(r.name) === normalizeRoleName(currentRoleName)) ||
    (currentRoleName ? { name: currentRoleName, permissions: {} } : null);

  const hasPermission = (permissionKey: keyof RolePermissions): boolean => {
    if (!currentRole) return false;
    if (permissionKey === 'platform.finance.view') {
      return isSuperAdminRole(currentRoleName);
    }
    const synced = syncRolePermissions(currentRole.permissions, currentRole.name);
    return Boolean(synced[permissionKey]);
  };

  return {
    currentRoleName,
    permissions: currentRole ? syncRolePermissions(currentRole.permissions, currentRole.name) : {},
    hasPermission
  };
}

interface RbacGateProps {
  permission: keyof RolePermissions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RbacGate({ permission, children, fallback = null }: RbacGateProps) {
  const { hasPermission } = useRbac();
  if (hasPermission(permission)) {
    return <React.Fragment>{children}</React.Fragment>;
  }
  return <React.Fragment>{fallback}</React.Fragment>;
}

export function syncRolePermissions(permissions?: RolePermissions, roleName?: string): RolePermissions {
  const synced: RolePermissions = {};
  
  const normalizedRole = (roleName || '').toLowerCase().trim();
  const hasGranularPermissions = PERMISSION_TREE.some((menu) =>
    menu.actions.some((action) => permissions?.[action.key] !== undefined)
  );

  if (isSuperAdminRole(roleName)) {
    PERMISSION_TREE.forEach((menu) => {
      menu.actions.forEach((act) => {
        synced[act.key] = true;
      });
    });
    synced['platform.finance.view'] = true;
    synced.viewOverview = true;
    synced.manageOrders = true;
    synced.manageProducts = true;
    synced.manageJournal = true;
    synced.manageSettings = true;
    synced.viewReports = true;
    return synced;
  }

  // Legacy system roles only stored broad permissions such as `manageProducts`.
  // Keep their historical full-access fallback until granular permissions exist.
  // Once a granular key is stored, including `false`, the saved choices are authoritative.
  if (
    normalizedRole === 'admin' ||
    normalizedRole === 'owner' ||
    normalizedRole === 'developer' ||
    normalizedRole.includes('admin')
  ) {
    if (!hasGranularPermissions) {
      PERMISSION_TREE.forEach((menu) => {
        menu.actions.forEach((act) => {
          synced[act.key] = true;
        });
      });
      synced.viewOverview = true;
      synced.manageOrders = true;
      synced.manageProducts = true;
      synced.manageJournal = true;
      synced.manageSettings = true;
      synced.viewReports = true;
      return synced;
    }
  }

  if (!permissions) return synced;

  Object.assign(synced, permissions);

  const checkAndSync = (newKey: string, legacyVal: boolean) => {
    if (synced[newKey] === undefined) {
      synced[newKey] = legacyVal;
    }
  };

  const hasLegacy = (key: string) => permissions[key] === true;

  checkAndSync('overview.view', hasLegacy('viewOverview'));

  const ordersVal = hasLegacy('manageOrders');
  checkAndSync('orders.view', ordersVal);
  checkAndSync('orders.process', ordersVal);
  checkAndSync('orders.export', ordersVal);

  const productsVal = hasLegacy('manageProducts');
  checkAndSync('products.view', productsVal);
  checkAndSync('products.create', productsVal);
  checkAndSync('products.edit', productsVal);
  checkAndSync('products.delete', productsVal);

  checkAndSync('stock.view', Boolean(synced['products.view']) || productsVal);
  checkAndSync('stock.manage', Boolean(synced['products.edit']) || productsVal);

  const journalVal = hasLegacy('manageJournal');
  checkAndSync('journal.view', journalVal);
  checkAndSync('journal.manage', journalVal);
  checkAndSync('testimonies.view', journalVal);
  checkAndSync('testimonies.manage', journalVal);

  const settingsVal = hasLegacy('manageSettings');
  checkAndSync('settings.view', settingsVal);
  checkAndSync('settings.manage', settingsVal);

  const reportsVal = hasLegacy('viewReports');
  checkAndSync('reports.view', reportsVal);

  // Fallback for user management permissions
  if (normalizedRole === 'manager') {
    checkAndSync('users.view', true);
    checkAndSync('users.manage', true);
    checkAndSync('users.reset_password', true);
    checkAndSync('users.delete', false);
  }

  return synced;
}
