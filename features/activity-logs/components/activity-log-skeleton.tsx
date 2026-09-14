import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ActivityLogSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 border-b pb-6"><Skeleton className="h-8 w-52" /><Skeleton className="h-4 w-96 max-w-full" /></div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)}
      </div>
      <Card className="gap-0 pb-0">
        <CardHeader><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-72 max-w-full" /></CardHeader>
        <CardContent className="space-y-3 border-t p-4">
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="space-y-3 md:hidden">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-44 w-full rounded-xl" />)}
          </div>
          <div className="hidden space-y-3 md:block">
            {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
