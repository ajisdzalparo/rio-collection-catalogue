import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ReferralDashboardSkeletonProps {
  canManage?: boolean;
}

export function ReferralDashboardSkeleton({ canManage = false }: ReferralDashboardSkeletonProps) {
  return (
    <div className="space-y-6" role="status" aria-label="Memuat data referral">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        {canManage && <Skeleton className="h-10 w-44 rounded-xl" />}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} size="sm">
            <CardContent className="space-y-3 p-4">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-7 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-3.5 w-72 max-w-full" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-9 w-64 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
