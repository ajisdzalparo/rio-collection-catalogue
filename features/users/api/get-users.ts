import { apiClient } from '@/lib/api/client';
import type { User } from '../types/user.types';
import type { ApiListResponse } from '@/types/api.type';

export async function getUsers(): Promise<ApiListResponse<User>> {
  const response = await apiClient.get<ApiListResponse<User>>('/users');
  return response.data;
}
