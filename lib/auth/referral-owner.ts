import { getAuthenticatedUser } from '@/lib/auth/authorization';
import { getEffectivePermissions } from './user-permissions';

export async function getReferralAccess() {
  const user = await getAuthenticatedUser();
  if (!user) return { user: null, canView: false, canManage: false, canSettle: false };
  const permissions = await getEffectivePermissions(user.role);
  const canView = permissions['referrals.view'] === true;
  return {
    user,
    canView,
    canManage: canView && permissions['referrals.manage'] === true,
    canSettle: canView && permissions['referrals.settle'] === true
  };
}

export async function getReferralViewer() {
  const access = await getReferralAccess();
  return access.canView ? access.user : null;
}

export async function getReferralManager() {
  const access = await getReferralAccess();
  return access.canManage ? access.user : null;
}

export async function getReferralSettler() {
  const access = await getReferralAccess();
  return access.canSettle ? access.user : null;
}
