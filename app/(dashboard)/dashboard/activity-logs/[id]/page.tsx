import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ActivityLogDetailPage } from '@/features/activity-logs/components/activity-log-detail-page';
import { getActivityLogViewer } from '@/lib/auth/authorization';

export const metadata: Metadata = {
  title: 'Detail Activity Log',
  description: 'Detail aktivitas pengelola CMS RIO COLLECTION.'
};

export const dynamic = 'force-dynamic';

interface ActivityLogDetailRouteProps {
  params: Promise<{ id: string }>;
}

export default async function ActivityLogDetailRoute({ params }: ActivityLogDetailRouteProps) {
  const viewer = await getActivityLogViewer();
  if (!viewer) redirect('/forbidden');

  const { id } = await params;
  return <ActivityLogDetailPage id={id} />;
}
