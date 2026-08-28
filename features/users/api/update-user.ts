import { apiClient } from '@/lib/api/client';
import type { User } from '../types/user.types';
import type { UserFormValues } from '../schemas/schema';

export async function updateUser(id: string, payload: Partial<UserFormValues>): Promise<User> {
  const response = await apiClient.patch<User>(`/users/${id}`, payload);
  return response.data;
}
