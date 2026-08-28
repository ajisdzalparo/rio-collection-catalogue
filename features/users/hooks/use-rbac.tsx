'use client';

import React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { env } from '@/config/env';
import type { RolePermissions, UserRole } from '../types/roles.types';

interface RbacState {
  roles: UserRole[];
  activeRoleName: string;
  setRoles: (roles: UserRole[]) => void;
  setActiveRole: (roleName: string) => void;
  updateRolePermissions: (roleName: string, permissions: Partial<RolePermissions>) => void;
  addRole: (newRole: { name: string; description?: string; permissions: RolePermissions }) => void;
  updateRole: (
    targetRoleName: string,
    updated: { name?: string; description?: string; permissions?: Partial<RolePermissions> }
  ) => void;
  deleteRole: (roleName: string) => void;
}

const DEFAULT_ROLES: UserRole[] = [
  {
    name: 'Admin',
    description: 'Akses penuh ke seluruh sistem dan konfigurasi',
    isSystemRole: true,
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
    isSystemRole: true,
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
    isSystemRole: true,
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
    isSystemRole: true,
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
    description: 'Pengelola konten produk dan artikel jurnal',
    isSystemRole: true,
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

export const useRbacStore = create<RbacState>()(
  persist(
    (set) => ({
      roles: DEFAULT_ROLES,
      activeRoleName: 'Admin',
      setRoles: (roles) => set({ roles }),
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
                permissions: newRole.permissions
              }
            ]
          };
        }),
      updateRole: (targetRoleName, updated) =>
        set((state) => ({
          roles: state.roles.map((r) =>
            r.name === targetRoleName
              ? {
                  ...r,
                  name: updated.name || r.name,
                  description:
                    updated.description !== undefined ? updated.description : r.description,
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
        })),
      deleteRole: (roleName) =>
        set((state) => {
          const filtered = state.roles.filter((r) => r.name !== roleName || r.isSystemRole);
          return {
            roles: filtered,
            activeRoleName: state.activeRoleName === roleName ? 'Admin' : state.activeRoleName
          };
        })
    }),
    {
      name: 'rio-rbac-store'
    }
  )
);

// React Query hook to fetch roles from VeloMock
export function useRolesQuery() {
  return useQuery({
    queryKey: ['mock-roles'],
    queryFn: async () => {
      const { data } = await axios.get(`${env.velomockUrl}/api/v1/roles`);
      if (data.code === 200 && data.data) {
        return data.data as UserRole[];
      }
      return Array.isArray(data) ? data : [];
    }
  });
}

export function useRbac() {
  const { roles, activeRoleName } = useRbacStore();
  const currentRole = roles.find((r) => r.name === activeRoleName) || roles[0];

  const hasPermission = (permissionKey: keyof RolePermissions): boolean => {
    if (!currentRole) return false;
    return Boolean(currentRole.permissions[permissionKey]);
  };

  return {
    currentRoleName: activeRoleName,
    permissions: currentRole?.permissions || {},
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
