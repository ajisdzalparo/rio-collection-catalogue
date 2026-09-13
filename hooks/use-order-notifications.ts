'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { formatIDR } from '@/lib/utils';
import type { OrderNotificationSnapshot } from '@/lib/order-notification-types';
import { useNotificationSounds } from '@/hooks/use-notification-sounds';
import { playNotificationSound } from '@/lib/notification-sound-player';

const LAST_SEEN_KEY = 'rio-dashboard-orders-last-seen-at';
const SOUND_ENABLED_KEY = 'rio-dashboard-order-sound-enabled';
const FALLBACK_POLL_INTERVAL_MS = 15_000;

export type NotificationConnectionStatus = 'connecting' | 'connected' | 'reconnecting';

interface InitialNotificationPreferences {
  lastSeenAt: string;
  soundEnabled: boolean;
  hadStoredBaseline: boolean;
}

async function fetchOrderNotifications(since: string): Promise<OrderNotificationSnapshot> {
  const { data } = await axios.get('/api/v1/orders/notifications', { params: { since } });
  if (data.code !== 200 || !data.data) {
    throw new Error(data.message || 'Respons notifikasi pesanan tidak valid');
  }
  return data.data as OrderNotificationSnapshot;
}

function getInitialPreferences(): InitialNotificationPreferences {
  const fallback: InitialNotificationPreferences = {
    lastSeenAt: new Date().toISOString(),
    soundEnabled: true,
    hadStoredBaseline: false
  };
  if (typeof window === 'undefined') return fallback;

  try {
    const storedLastSeen = window.localStorage.getItem(LAST_SEEN_KEY);
    const hasValidLastSeen = Boolean(
      storedLastSeen && !Number.isNaN(Date.parse(storedLastSeen))
    );
    return {
      lastSeenAt: hasValidLastSeen ? (storedLastSeen as string) : fallback.lastSeenAt,
      soundEnabled: window.localStorage.getItem(SOUND_ENABLED_KEY) !== 'false',
      hadStoredBaseline: hasValidLastSeen
    };
  } catch {
    return fallback;
  }
}

export function useOrderNotifications() {
  const queryClient = useQueryClient();
  const { selectedSound } = useNotificationSounds();
  const [initialPreferences] = useState(getInitialPreferences);
  const [lastSeenAt, setLastSeenAt] = useState(initialPreferences.lastSeenAt);
  const [soundEnabled, setSoundEnabled] = useState(initialPreferences.soundEnabled);
  const [connectionStatus, setConnectionStatus] =
    useState<NotificationConnectionStatus>('connecting');
  const hadStoredBaselineRef = useRef(initialPreferences.hadStoredBaseline);
  const previousNewestIdRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(LAST_SEEN_KEY, lastSeenAt);
      window.localStorage.setItem(SOUND_ENABLED_KEY, String(soundEnabled));
    } catch {
      // The in-memory preferences still keep notifications usable.
    }
  }, [lastSeenAt, soundEnabled]);

  const query = useQuery<OrderNotificationSnapshot, Error>({
    queryKey: ['orders', 'notifications', lastSeenAt],
    queryFn: () => fetchOrderNotifications(lastSeenAt as string),
    refetchInterval:
      connectionStatus === 'connected' ? false : FALLBACK_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    retry: 1
  });

  useEffect(() => {
    if (typeof EventSource === 'undefined') {
      return;
    }

    const source = new EventSource(
      `/api/v1/orders/notifications/stream?since=${encodeURIComponent(lastSeenAt)}`
    );

    source.onopen = () => setConnectionStatus('connected');
    source.addEventListener('orders', (event) => {
      try {
        const snapshot = JSON.parse((event as MessageEvent<string>).data) as OrderNotificationSnapshot;
        queryClient.setQueryData(['orders', 'notifications', lastSeenAt], snapshot);
        setConnectionStatus('connected');
      } catch {
        setConnectionStatus('reconnecting');
      }
    });
    source.addEventListener('stream-error', () => setConnectionStatus('reconnecting'));
    source.onerror = () => setConnectionStatus('reconnecting');

    return () => source.close();
  }, [lastSeenAt, queryClient]);

  useEffect(() => {
    const notificationData = query.data;
    const newestOrder = notificationData?.latestOrders[0];
    if (!notificationData || !newestOrder) return;

    const previousNewestId = previousNewestIdRef.current;
    const isFirstResult = previousNewestId === null;
    const isNewerThanLastSeen = new Date(newestOrder.createdAt) > new Date(lastSeenAt);
    const shouldNotify =
      isNewerThanLastSeen &&
      notificationData.unreadCount > 0 &&
      (!isFirstResult || hadStoredBaselineRef.current);

    previousNewestIdRef.current = newestOrder.id;

    if (!shouldNotify || previousNewestId === newestOrder.id) return;

    if (soundEnabled) void playNotificationSound(selectedSound?.url);
    toast.info(notificationData.unreadCount > 1 ? `${notificationData.unreadCount} order baru masuk` : 'Order baru masuk', {
      description: `${newestOrder.fullName} · ${formatIDR(newestOrder.totalPrice)}`
    });
    void queryClient.invalidateQueries({ queryKey: ['orders'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
  }, [lastSeenAt, query.data, queryClient, selectedSound?.url, soundEnabled]);

  const markAllAsRead = () => {
    const newestCreatedAt = query.data?.latestOrders[0]?.createdAt;
    const nextLastSeenAt = newestCreatedAt || new Date().toISOString();
    try {
      window.localStorage.setItem(LAST_SEEN_KEY, nextLastSeenAt);
    } catch {
      // The in-memory state still keeps notifications usable.
    }
    setConnectionStatus('connecting');
    setLastSeenAt(nextLastSeenAt);
  };

  const toggleSound = () => {
    const nextValue = !soundEnabled;
    setSoundEnabled(nextValue);
    try {
      window.localStorage.setItem(SOUND_ENABLED_KEY, String(nextValue));
    } catch {
      // The preference remains active for the current page session.
    }
    if (nextValue) void playNotificationSound(selectedSound?.url);
  };

  return {
    notifications: query.data?.latestOrders ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    soundEnabled,
    isLoading: query.isLoading,
    isError: query.isError,
    connectionStatus,
    markAllAsRead,
    toggleSound
  };
}
