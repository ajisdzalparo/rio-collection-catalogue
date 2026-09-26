'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '@/hooks/use-auth';
import { isSuperAdminRole } from '@/lib/auth/roles';
import type { RolePermissions, UserRole } from '../types/roles.types';

export { syncRolePermissions } from '@/lib/auth/role-permissions';

export function useRolesQuery() {
  return useQuery<UserRole[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/roles');
      return data.code === 200 && Array.isArray(data.data) ? (data.data as UserRole[]) : [];
    }
  });
}

export function useRolesPageQuery(params: { search?: string; page: number; pageSize: number }) {
  return useQuery<{
    roles: UserRole[];
    meta: { page: number; pageSize: number; total: number; totalPages: number };
  }>({
    queryKey: ['roles', 'page', params],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/roles', { params });
      if (data.code !== 200 || !Array.isArray(data.data)) {
        throw new Error(data.message || 'Gagal memuat master role.');
      }
      return { roles: data.data as UserRole[], meta: data.meta };
    },
    placeholderData: (previousData) => previousData
  });
}

export function useRbac() {
  const { user, isLoading } = useAuth();
  const currentRoleName = isLoading ? '' : user?.role || '';
  const permissions: RolePermissions = user?.permissions ?? {};

  const hasPermission = (permissionKey: keyof RolePermissions): boolean => {
    if (!user || isLoading) return false;
    if (permissionKey === 'platform.finance.view') return isSuperAdminRole(currentRoleName);
    return permissions[permissionKey] === true;
  };

  return { currentRoleName, permissions, hasPermission, isLoading };
}

interface RbacGateProps {
  permission: keyof RolePermissions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RbacGate({ permission, children, fallback = null }: RbacGateProps) {
  const { hasPermission } = useRbac();
  return <React.Fragment>{hasPermission(permission) ? children : fallback}</React.Fragment>;
}
