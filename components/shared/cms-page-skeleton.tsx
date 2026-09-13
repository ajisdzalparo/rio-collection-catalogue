import { Skeleton, SkeletonTable } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type CmsSkeletonVariant = 'list' | 'dashboard' | 'report' | 'detail' | 'form' | 'settings';

interface CmsPageSkeletonProps {
  variant?: CmsSkeletonVariant;
  showHeader?: boolean;
  className?: string;
}

function HeaderSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 max-w-[70vw]" />
        <Skeleton className="h-4 w-96 max-w-[80vw]" />
      </div>
      <Skeleton className="h-10 w-36 rounded-xl" />
    </div>
  );
}

function MetricsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="min-h-28 space-y-5 rounded-xl border border-border/50 bg-card p-5">
          <Skeleton className="h-4 w-4" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-6 w-36" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FilterSkeleton() {
  return (
    <div className="grid gap-3 rounded-xl border border-border/50 bg-card p-4 sm:grid-cols-2 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)_160px]">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 sm:p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-6 h-10 w-40 rounded-xl" />
    </div>
  );
}

export function CmsPageSkeleton({
  variant = 'list',
  showHeader = true,
  className
}: CmsPageSkeletonProps) {
  return (
    <div
      className={cn('w-full space-y-6 pb-10', className)}
      role="status"
      aria-label="Memuat konten CMS"
      aria-busy="true"
    >
      {showHeader && <HeaderSkeleton />}

      {(variant === 'dashboard' || variant === 'report') && <MetricsSkeleton />}

      {variant === 'dashboard' && (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-72 rounded-xl lg:col-span-2" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
          <SkeletonTable rows={5} cols={6} />
        </>
      )}

      {variant === 'report' && (
        <>
          <FilterSkeleton />
          <Skeleton className="h-80 w-full rounded-xl" />
          <SkeletonTable rows={5} cols={6} />
        </>
      )}

      {variant === 'list' && (
        <>
          <FilterSkeleton />
          <SkeletonTable rows={6} cols={6} />
        </>
      )}

      {variant === 'detail' && (
        <>
          <div className="rounded-xl border border-border/50 bg-card p-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-16 w-16 rounded-xl" />
              <div className="flex-1 space-y-2"><Skeleton className="h-6 w-56" /><Skeleton className="h-4 w-72 max-w-full" /></div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-16 w-full" />)}
            </div>
          </div>
          <SkeletonTable rows={4} cols={5} />
        </>
      )}

      {(variant === 'form' || variant === 'settings') && <FormSkeleton />}
      {variant === 'settings' && <FormSkeleton />}
    </div>
  );
}
