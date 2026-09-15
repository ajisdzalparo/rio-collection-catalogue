'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { RolePermissions, UserRole } from '../types/roles.types';

interface RolePayload {
  name?: string;
  description?: string | null;
  permissions?: RolePermissions;
  isActive?: boolean;
}

export function useRoleMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['roles'] });
  const create = useMutation({
    mutationFn: async (payload: { name: string; description?: string; permissions: RolePermissions }) => {
      const { data } = await axios.post('/api/v1/roles', payload);
      return data.data as UserRole;
    },
    onSuccess: invalidate
  });
  const update = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: RolePayload }) => {
      const { data } = await axios.patch(`/api/v1/roles/${id}`, payload);
      return data.data as UserRole;
    },
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['roles'] });
      const previousRoles = queryClient.getQueryData<UserRole[]>(['roles']);

      queryClient.setQueryData<UserRole[]>(['roles'], (old) => {
        if (!old) return [];
        return old.map((role) =>
          role.id === id
            ? {
                ...role,
                ...(payload.name !== undefined && { name: payload.name }),
                ...(payload.description !== undefined && { description: payload.description || undefined }),
                ...(payload.permissions !== undefined && { permissions: payload.permissions }),
                ...(payload.isActive !== undefined && { isActive: payload.isActive })
              }
            : role
        );
      });

      return { previousRoles };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousRoles) {
        queryClient.setQueryData(['roles'], context.previousRoles);
      }
    },
    onSettled: invalidate
  });
  const remove = useMutation({
    mutationFn: async (id: string) => axios.delete(`/api/v1/roles/${id}`),
    onSuccess: invalidate
  });
  return { create, update, remove };
}
