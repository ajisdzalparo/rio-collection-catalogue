import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getReferralAccess } from '@/lib/auth/referral-owner';
import { ReferralPartnerDetailPage } from '@/features/referrals/components/referral-partner-detail-page';

export const metadata: Metadata = { title: 'Detail Partner Referral | RIO Collection' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReferralPartnerPage({ params }: PageProps) {
  const access = await getReferralAccess();
  if (!access.canView) redirect('/forbidden');

  const { id } = await params;

  return (
    <ReferralPartnerDetailPage
      partnerId={id}
      canManage={access.canManage}
      canSettle={access.canSettle}
    />
  );
}
