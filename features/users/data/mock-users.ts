import type { User } from '../types/user.types';

export const MOCK_USERS: User[] = [
  { id: 'usr-1', name: 'Ajis Johnson', email: 'Ajis@example.com', role: 'Admin', status: 'active' },
  {
    id: 'usr-2',
    name: 'Sarah Connor',
    email: 'sarah@example.com',
    role: 'Developer',
    status: 'active'
  },
  {
    id: 'usr-3',
    name: 'Michael Scott',
    email: 'michael@example.com',
    role: 'Manager',
    status: 'active'
  },
  {
    id: 'usr-4',
    name: 'Dwight Schrute',
    email: 'dwight@example.com',
    role: 'Sales',
    status: 'inactive'
  },
  { id: 'usr-5', name: 'Pam Beesly', email: 'pam@example.com', role: 'Designer', status: 'active' }
];
