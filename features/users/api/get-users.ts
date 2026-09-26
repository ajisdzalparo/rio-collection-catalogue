import axios from 'axios';
import type { User } from '../types/user.types';
import type { ApiListResponse } from '@/types/api.type';

export interface GetUsersParams {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function getUsers(params?: GetUsersParams): Promise<ApiListResponse<User>> {
  const queryParams: Record<string, string> = {};
  if (params?.search) queryParams.search = params.search;
  if (params?.role) queryParams.role = params.role;
  if (params?.status) queryParams.status = params.status;
  if (params?.page) queryParams.page = String(params.page);
  if (params?.pageSize) queryParams.pageSize = String(params.pageSize);

  const { data } = await axios.get('/api/v1/users', { params: queryParams });
  const userList = data.code === 200 && data.data ? data.data : Array.isArray(data) ? data : [];
  const meta = data.meta ?? {
    page: 1,
    pageSize: userList.length,
    total: userList.length,
    totalPages: 1
  };

  return {
    success: true,
    message: 'Users fetched successfully',
    meta: {
      page: meta.page,
      per_page: meta.pageSize,
      total: meta.total,
      last_page: meta.totalPages
    },
    data: userList as User[]
  };
}
