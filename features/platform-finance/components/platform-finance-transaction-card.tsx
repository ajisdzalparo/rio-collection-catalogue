import Link from 'next/link';
import { CalendarDays, ReceiptText, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatIDR } from '@/lib/utils';
import type { PlatformFinanceTransaction } from '../types';

interface PlatformFinanceTransactionCardProps {
  transaction: PlatformFinanceTransaction;
}

function formatTransactionDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value));
}

export function PlatformFinanceTransactionCard({
  transaction
}: PlatformFinanceTransactionCardProps) {
  const commissionRate =
    transaction.commissionMode === 'PERCENTAGE'
      ? `${transaction.commissionValue}%`
      : formatIDR(transaction.commissionValue);

  return (
    <article className="space-y-3 rounded-xl border border-border/70 bg-card/90 p-3.5 shadow-2xs">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Nomor order
          </span>
          <Link
            href={`/dashboard/orders/${transaction.id}`}
            className="mt-0.5 block truncate font-mono text-sm font-extrabold text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {transaction.orderNumber}
          </Link>
        </div>
        <Badge
          variant="secondary"
          className="shrink-0 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
        >
          {transaction.status}
        </Badge>
      </header>

      <div className="grid gap-1.5 border-y border-border/30 py-2 text-[11px] text-muted-foreground min-[380px]:grid-cols-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <UserRound className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{transaction.customerName}</span>
        </span>
        <span className="flex items-center gap-1.5 min-[380px]:justify-end">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span className="whitespace-nowrap">{formatTransactionDate(transaction.createdAt)}</span>
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted/35 p-2.5">
          <dt className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            <ReceiptText className="h-3 w-3" />
            Subtotal
          </dt>
          <dd className="mt-1 break-words text-xs font-extrabold tabular-nums text-foreground">
            {formatIDR(transaction.baseAmount)}
          </dd>
        </div>
        <div className="rounded-lg bg-emerald-500/8 p-2.5">
          <dt className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            Komisi
          </dt>
          <dd className="mt-1 break-words text-xs font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatIDR(transaction.commissionAmount)}
          </dd>
        </div>
      </dl>

      <p className="text-[10px] text-muted-foreground">
        {transaction.commissionMode === 'PERCENTAGE' ? 'Persentase' : 'Nominal'}{' '}
        <span className="font-bold text-foreground">{commissionRate}</span>
      </p>
    </article>
  );
}
