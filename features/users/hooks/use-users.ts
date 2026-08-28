'use client';

import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../api/get-users';
import { userKeys } from '../keys';

export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: getUsers
  });
}
