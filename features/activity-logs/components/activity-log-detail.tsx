'use client';

import Link from 'next/link';
import { ArrowLeft, Globe, Monitor, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ActivityLogItem } from '../types';

interface ActivityLogDetailProps {
  activity: ActivityLogItem;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(value));
}

function formatAction(action: string) {
  return action.replaceAll('_', ' ');
}

function renderMetadata(metadata: unknown) {
  if (metadata === null || metadata === undefined) return null;
  if (typeof metadata === 'string') return metadata;
  return JSON.stringify(metadata, null, 2);
}

export function ActivityLogDetail({ activity }: ActivityLogDetailProps) {
  const metadata = renderMetadata(activity.metadata);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Link href="/dashboard/activity-logs" className="-ml-3 inline-flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition-colors hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Activity Log
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Audit Trail</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Detail Aktivitas</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Rincian lengkap aktivitas yang dilakukan di dalam CMS, termasuk pelaku, waktu, IP, dan perubahan data.
            </p>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Badge className="h-7 px-3 text-[11px]">{formatAction(activity.action)}</Badge>
          <Badge variant="secondary" className="h-7 px-3 text-[11px]">{activity.module}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border/30">
          <CardTitle className="text-base">Apa yang dilakukan</CardTitle>
          <CardDescription>{formatDate(activity.createdAt)} WIB</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm font-semibold leading-relaxed">
            {activity.description}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm"><UserRound className="h-4 w-4 text-primary" />Pelaku Aktivitas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow label="Nama" value={activity.actorName} strong />
            <DetailRow label="Email" value={activity.actorEmail} />
            <DetailRow label="Role" value={activity.actorRole} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm"><Globe className="h-4 w-4 text-primary" />Konteks Akses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow label="IP address" value={activity.ipAddress || 'Tidak tercatat'} mono />
            <DetailRow label="User-agent" value={activity.userAgent || 'Tidak tercatat'} />
            <DetailRow label="Waktu" value={formatDate(activity.createdAt)} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><Monitor className="h-4 w-4 text-primary" />Objek yang Diproses</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailRow label="Jenis objek" value={activity.entityType || 'Tidak ada'} />
          <DetailRow label="ID objek" value={activity.entityId || 'Tidak ada'} mono />
        </CardContent>
      </Card>

      {metadata && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Data Perubahan</CardTitle>
            <CardDescription>Snapshot data yang dikirim atau berubah saat aktivitas terjadi.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-auto rounded-xl border bg-muted/40 p-4 text-xs leading-relaxed">{metadata}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DetailRow({ label, value, strong = false, mono = false }: { label: string; value: string; strong?: boolean; mono?: boolean }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[120px_1fr] sm:items-start sm:gap-3">
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className={`break-words text-sm ${strong ? 'font-bold' : 'font-medium'} ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}
