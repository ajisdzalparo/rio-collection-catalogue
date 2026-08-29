import axios from 'axios';
import type { User } from '../types/user.types';
import type { ApiListResponse } from '@/types/api.type';

export async function getUsers(): Promise<ApiListResponse<User>> {
  const { data } = await axios.get('/api/v1/users');
  const userList = data.code === 200 && data.data ? data.data : Array.isArray(data) ? data : [];

  return {
    success: true,
    message: 'Users fetched successfully',
    meta: {
      page: 1,
      per_page: 100,
      total: userList.length,
      last_page: 1
    },
    data: userList as User[]
  };
}
