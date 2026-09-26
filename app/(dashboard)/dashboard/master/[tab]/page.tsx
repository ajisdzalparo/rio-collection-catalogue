'use client';

import React, { use, Suspense } from 'react';
import MasterDataPageContent from '../components/master-data-page-content';
import { CmsPageSkeleton } from '@/components/shared/cms-page-skeleton';

interface MasterTabProps {
  params: Promise<{ tab: string }>;
}

export default function MasterTabPage({ params }: MasterTabProps) {
  const { tab } = use(params);

  return (
    <Suspense fallback={<CmsPageSkeleton variant="list" />}>
      <MasterDataPageContent tabSlug={tab} />
    </Suspense>
  );
}
