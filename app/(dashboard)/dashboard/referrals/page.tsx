import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getReferralAccess } from '@/lib/auth/referral-owner';
import { ReferralDashboard } from '@/features/referrals/components/referral-dashboard';

export const metadata: Metadata = { title: 'Referral & Partner | RIO Collection' };

export default async function ReferralsPage() {
  const access = await getReferralAccess();
  if (!access.canView) redirect('/forbidden');
  return <ReferralDashboard canManage={access.canManage} canSettle={access.canSettle} />;
}
