import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  canViewActivityLogs,
  isSuperAdminRole,
  parseAuthCookieUser,
  type AuthCookieUser
} from './roles';
import { getEffectivePermissions } from './user-permissions';
import type { RolePermissions } from '@/features/users/types/roles.types';

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

export async function authorizeUserWithPermission(
  permissionKey: keyof RolePermissions | (keyof RolePermissions)[]
): Promise<
  | { success: true; user: AuthCookieUser; permissions: RolePermissions }
  | { success: false; response: NextResponse }
> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return {
      success: false,
      response: NextResponse.json(
        { code: 401, status: 'error', message: 'Belum login atau sesi telah berakhir' },
        { status: 401 }
      )
    };
  }

  if (isSuperAdminRole(user.role)) {
    const permissions = await getEffectivePermissions(user.role);
    return { success: true, user, permissions };
  }

  const keys = Array.isArray(permissionKey) ? permissionKey : [permissionKey];
  const permissions = await getEffectivePermissions(user.role);

  if (keys.includes('platform.finance.view') && !isSuperAdminRole(user.role)) {
    return {
      success: false,
      response: NextResponse.json(
        { code: 403, status: 'error', message: 'Akses ditolak: Menu ini khusus Super Admin' },
        { status: 403 }
      )
    };
  }

  const hasAnyPermission = keys.some((k) => permissions[k] === true);
  if (!hasAnyPermission) {
    return {
      success: false,
      response: NextResponse.json(
        {
          code: 403,
          status: 'error',
          message: `Akses ditolak: Anda tidak memiliki hak akses (${keys.join(', ')})`
        },
        { status: 403 }
      )
    };
  }

  return { success: true, user, permissions };
}

