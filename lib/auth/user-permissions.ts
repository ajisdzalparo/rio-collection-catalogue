import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { RolePermissions } from '@/features/users/types/roles.types';
import { parseRolePermissions, syncRolePermissions } from './role-permissions';
import { resolveReferralAccess } from './referral-permissions';
import { isSuperAdminRole } from './roles';

export async function getEffectivePermissions(roleName: string): Promise<RolePermissions> {
  if (isSuperAdminRole(roleName)) return syncRolePermissions({}, roleName);

  const where = { name: { equals: roleName, mode: 'insensitive' as const } };
  let role;
  try {
    role = await prisma.role.findFirst({ where, select: { isActive: true, permissions: true } });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2022') throw error;
    const legacyRole = await prisma.role.findFirst({ where, select: { permissions: true } });
    role = legacyRole ? { ...legacyRole, isActive: true } : null;
  }
  if (!role || !role.isActive) return {};

  const permissions = syncRolePermissions(parseRolePermissions(role.permissions), roleName);
  const referral = resolveReferralAccess(roleName, role);
  permissions['referrals.view'] = referral.canView;
  permissions['referrals.manage'] = referral.canManage;
  permissions['referrals.settle'] = referral.canSettle;
  permissions['platform.finance.view'] = false;
  return permissions;
}
