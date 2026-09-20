import { isOwnerRole, isSuperAdminRole } from './roles';

export interface ReferralAccess {
  canView: boolean;
  canManage: boolean;
  canSettle: boolean;
}

export function resolveReferralAccess(
  roleName: string,
  role: { isActive: boolean; permissions: unknown } | null
): ReferralAccess {
  if (isSuperAdminRole(roleName)) return { canView: true, canManage: true, canSettle: true };
  if (role && !role.isActive) return { canView: false, canManage: false, canSettle: false };

  const raw = role?.permissions;
  const permissions = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? raw as Record<string, unknown>
    : {};
  const allowed = (key: string) => permissions[key] === true || (permissions[key] === undefined && isOwnerRole(roleName));
  const canView = allowed('referrals.view');
  return {
    canView,
    canManage: canView && allowed('referrals.manage'),
    canSettle: canView && allowed('referrals.settle')
  };
}
