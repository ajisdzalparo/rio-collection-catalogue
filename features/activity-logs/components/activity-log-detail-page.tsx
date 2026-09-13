'use client';

import { CmsPageSkeleton } from '@/components/shared/cms-page-skeleton';
import { ErrorState } from '@/components/shared';
import { useActivityLog } from '../hooks/use-activity-logs';
import { ActivityLogDetail } from './activity-log-detail';

interface ActivityLogDetailPageProps {
  id: string;
}

export function ActivityLogDetailPage({ id }: ActivityLogDetailPageProps) {
  const { data, isLoading, error } = useActivityLog(id);

  if (isLoading) return <CmsPageSkeleton variant="detail" />;
  if (error || !data) return <ErrorState message={error?.message || 'Aktivitas tidak ditemukan.'} />;

  return <ActivityLogDetail activity={data} />;
}
