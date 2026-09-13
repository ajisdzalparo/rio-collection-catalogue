'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { VStack } from '@/components/ui/layout';

export function PlatformFinanceSkeleton() {
  return (
    <VStack gap="lg" className="pb-10" aria-label="Memuat finance platform" role="status">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-[min(42rem,80vw)]" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      <section className="w-full space-y-3">
        <div className="flex items-center justify-between"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-36" /></div>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} size="sm" className="min-h-28"><CardContent className="flex h-full flex-col justify-between gap-3"><Skeleton className="h-4 w-4" /><div className="space-y-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-6 w-32" /></div></CardContent></Card>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader className="space-y-2"><Skeleton className="h-5 w-40" /><Skeleton className="h-3 w-96 max-w-full" /></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-44" /></CardContent>
      </Card>

      <Card className="gap-0 pb-0">
        <CardHeader className="space-y-2 border-b border-border/30"><Skeleton className="h-5 w-44" /><Skeleton className="h-3 w-72 max-w-full" /></CardHeader>
        <div className="flex gap-3 border-b border-border/30 px-4 py-3">
          <Skeleton className="h-10 w-full sm:max-w-md" />
          <Skeleton className="h-10 w-24 shrink-0 rounded-lg" />
        </div>
        <CardContent className="space-y-3 p-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></CardContent>
      </Card>
    </VStack>
  );
}
