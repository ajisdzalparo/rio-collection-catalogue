'use client';

import { useQuery } from '@tanstack/react-query';
import { getUsers, type GetUsersParams } from '../api/get-users';
import { userKeys } from '../keys';

export function useUsers(params?: GetUsersParams) {
  const queryKey = [
    ...userKeys.lists(),
    params?.search || '',
    params?.role || '',
    params?.status || '',
    params?.page || 1,
    params?.pageSize || ''
  ];

  return useQuery({
    queryKey,
    queryFn: () => getUsers(params),
    placeholderData: (previousData) => previousData
  });
}
