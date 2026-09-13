'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, BellRing, Check, Music2, ShoppingBag, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useOrderNotifications } from '@/hooks/use-order-notifications';
import { formatIDR } from '@/lib/utils';
import { NotificationSoundManager } from '@/components/dashboard/notification-sound-manager';

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit'
});

export function OrderNotifications() {
  const [isSoundManagerOpen, setIsSoundManagerOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    soundEnabled,
    isLoading,
    isError,
    connectionStatus,
    markAllAsRead,
    toggleSound
  } = useOrderNotifications();
  const hasUnread = unreadCount > 0;

  return (
    <>
    <DropdownMenu onOpenChange={(open) => open && markAllAsRead()}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-xl border border-border/70 bg-background/70 shadow-xs"
            aria-label={
              hasUnread ? `${unreadCount} notifikasi order belum dibaca` : 'Notifikasi order'
            }
          >
            {hasUnread ? (
              <BellRing className="h-4 w-4 text-amber-500" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {hasUnread ? (
              <span className="absolute -right-1 -top-1 flex min-w-4.5 h-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-extrabold leading-none text-white ring-2 ring-background">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </Button>
        }
      />

      <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl p-2 shadow-xl">
        <div className="flex items-center justify-between gap-3 px-2 py-1.5">
          <div>
            <p className="text-sm font-extrabold text-foreground">Order Terbaru</p>
            <p className="text-[10px] text-muted-foreground">
              {connectionStatus === 'connected'
                ? 'Realtime aktif'
                : connectionStatus === 'connecting'
                  ? 'Menghubungkan realtime...'
                  : 'Menghubungkan kembali · fallback aktif'}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleSound}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={soundEnabled ? 'Matikan suara notifikasi' : 'Aktifkan suara notifikasi'}
            title={soundEnabled ? 'Suara aktif' : 'Suara nonaktif'}
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>
        </div>

        <DropdownMenuSeparator />

        <div className="max-h-80 overflow-y-auto py-1">
          {isLoading ? (
            <p className="px-3 py-8 text-center text-xs text-muted-foreground">Memuat order...</p>
          ) : isError ? (
            <p className="px-3 py-8 text-center text-xs text-destructive">Notifikasi belum dapat dimuat.</p>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Belum ada order masuk.</p>
            </div>
          ) : (
            notifications.map((order) => (
              <DropdownMenuItem
                key={order.id}
                render={
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="flex items-start gap-3 rounded-xl px-2.5 py-2.5"
                  />
                }
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <ShoppingBag className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-extrabold text-foreground">
                      {order.fullName}
                    </span>
                    <span className="shrink-0 text-[9px] font-medium text-muted-foreground">
                      {dateFormatter.format(new Date(order.createdAt))}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                    #{order.orderNumber} · {formatIDR(order.totalPrice)}
                  </span>
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setIsSoundManagerOpen(true)}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl py-2"
        >
          <Music2 className="h-3.5 w-3.5" />
          <span>Kelola suara notifikasi</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <Link
              href="/dashboard/orders"
              className="flex items-center justify-center gap-2 rounded-xl py-2 text-center"
            />
          }
        >
          <Check className="h-3.5 w-3.5" />
          <span>Lihat semua pesanan</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <NotificationSoundManager open={isSoundManagerOpen} onOpenChange={setIsSoundManagerOpen} />
    </>
  );
}
