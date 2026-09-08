import axios from 'axios';
import type { User } from '../types/user.types';
import type { UserFormValues } from '../schemas/schema';

export async function updateUser(id: string, payload: Partial<UserFormValues>): Promise<User> {
  const response = await axios.patch<{ data: User }>(`/api/v1/users/${id}`, payload);
  return response.data.data;
}
