'use client';

import { useAuth } from '@/hooks/use-auth';

export function useReferralAccess() {
  const { user } = useAuth();
  const permissions = user?.permissions;
  const canView = permissions?.['referrals.view'] === true;
  return { data: {
    canView,
    canManage: canView && permissions?.['referrals.manage'] === true,
    canSettle: canView && permissions?.['referrals.settle'] === true
  } };
}
