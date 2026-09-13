import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ActivityLogPage } from '@/features/activity-logs/components/activity-log-page';
import { getActivityLogViewer } from '@/lib/auth/authorization';

export const metadata: Metadata = {
  title: 'Activity Log',
  description: 'Riwayat aktivitas pengelola CMS RIO COLLECTION.'
};

export const dynamic = 'force-dynamic';

export default async function ActivityLogsRoute() {
  const viewer = await getActivityLogViewer();
  if (!viewer) redirect('/forbidden');
  return <ActivityLogPage />;
}
