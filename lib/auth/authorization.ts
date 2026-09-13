import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import {
  canViewActivityLogs,
  isSuperAdminRole,
  parseAuthCookieUser,
  type AuthCookieUser
} from './roles';

export async function getAuthenticatedUser(): Promise<AuthCookieUser | null> {
  const cookieStore = await cookies();
  const cookieUser = parseAuthCookieUser(cookieStore.get('auth_token')?.value);
  if (!cookieUser) return null;

  try {
    const databaseUser = await prisma.user.findUnique({
      where: { id: cookieUser.id },
      select: { id: true, name: true, email: true, role: true, status: true }
    });

    if (!databaseUser || databaseUser.status !== 'active') return null;
    return databaseUser;
  } catch {
    return null;
  }
}

export async function getSuperAdminUser(): Promise<AuthCookieUser | null> {
  const user = await getAuthenticatedUser();
  return user && isSuperAdminRole(user.role) && user.status === 'active' ? user : null;
}

export async function getActivityLogViewer(): Promise<AuthCookieUser | null> {
  const user = await getAuthenticatedUser();
  return user && canViewActivityLogs(user.role) && user.status === 'active' ? user : null;
}
