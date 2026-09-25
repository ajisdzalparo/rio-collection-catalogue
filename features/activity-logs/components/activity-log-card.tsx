import Link from 'next/link';
import { CalendarClock, Eye, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ActivityLogItem } from '../types';

export const activityActionStyles: Record<string, string> = {
  CREATE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  UPDATE: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  DELETE: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  PASSWORD_RESET: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  STATUS_CHANGE: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  SETTINGS_UPDATE: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  LOGIN: 'bg-slate-500/10 text-slate-600 dark:text-slate-300'
};

export function formatActivityTimestamp(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(value));
}

interface ActivityLogCardProps {
  item: ActivityLogItem;
  isFetching: boolean;
}

export function ActivityLogCard({ item, isFetching }: ActivityLogCardProps) {
  return (
    <article
      className={cn(
        'space-y-3 rounded-xl border border-border/70 bg-card/90 p-3.5 shadow-2xs transition-opacity',
        isFetching && 'opacity-60'
      )}
    >
      <header className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className={activityActionStyles[item.action]}>
          {item.action.replaceAll('_', ' ')}
        </Badge>
        <Badge variant="outline" className="max-w-full truncate text-[10px]">
          {item.module}
        </Badge>
      </header>

      <p className="wrap-break-word text-sm font-semibold leading-relaxed text-foreground">
        {item.description}
      </p>

      <div className="grid gap-2 border-y border-border/30 py-2 text-[11px] text-muted-foreground min-[400px]:grid-cols-2">
        <div className="flex min-w-0 items-start gap-1.5">
          <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0">
            <strong className="block truncate font-bold text-foreground">{item.actorName}</strong>
            <span className="block truncate">{item.actorEmail}</span>
          </span>
        </div>
        <span className="flex items-center gap-1.5 min-[400px]:justify-end">
          <CalendarClock className="h-3.5 w-3.5 shrink-0" />
          <span className="whitespace-nowrap">{formatActivityTimestamp(item.createdAt)}</span>
        </span>
      </div>

      <Link
        href={`/dashboard/activity-logs/${item.id}`}
        aria-label={`Lihat detail ${item.description}`}
        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border/70 bg-background px-3 text-xs font-bold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Eye className="h-3.5 w-3.5" />
        Lihat Detail
      </Link>
    </article>
  );
}
