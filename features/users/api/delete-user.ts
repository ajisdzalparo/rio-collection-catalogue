import axios from 'axios';

export async function deleteUser(id: string): Promise<void> {
  await axios.delete(`/api/v1/users/${id}`);
}
