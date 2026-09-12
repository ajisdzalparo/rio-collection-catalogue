'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { formatIDR } from '@/lib/utils';

const LAST_SEEN_KEY = 'rio-dashboard-orders-last-seen-at';
const SOUND_ENABLED_KEY = 'rio-dashboard-order-sound-enabled';
const POLL_INTERVAL_MS = 5_000;

export interface OrderNotification {
  id: string;
  orderNumber: string;
  fullName: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

interface OrderNotificationResponse {
  unreadCount: number;
  latestOrders: OrderNotification[];
}

interface InitialNotificationPreferences {
  lastSeenAt: string;
  soundEnabled: boolean;
  hadStoredBaseline: boolean;
}

type BrowserWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

async function playNotificationSound() {
  const AudioContextConstructor =
    window.AudioContext || (window as BrowserWindow).webkitAudioContext;
  if (!AudioContextConstructor) return;

  try {
    const audioContext = new AudioContextConstructor();
    await audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const start = audioContext.currentTime;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, start);
    oscillator.frequency.setValueAtTime(660, start + 0.12);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.34);
    oscillator.addEventListener('ended', () => void audioContext.close(), { once: true });
  } catch {
    // Browsers may block audio until the user has interacted with the page.
  }
}

async function fetchOrderNotifications(since: string): Promise<OrderNotificationResponse> {
  const { data } = await axios.get('/api/v1/orders/notifications', { params: { since } });
  if (data.code !== 200 || !data.data) {
    throw new Error(data.message || 'Respons notifikasi pesanan tidak valid');
  }
  return data.data as OrderNotificationResponse;
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
  const [initialPreferences] = useState(getInitialPreferences);
  const [lastSeenAt, setLastSeenAt] = useState(initialPreferences.lastSeenAt);
  const [soundEnabled, setSoundEnabled] = useState(initialPreferences.soundEnabled);
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

  const query = useQuery<OrderNotificationResponse, Error>({
    queryKey: ['orders', 'notifications', lastSeenAt],
    queryFn: () => fetchOrderNotifications(lastSeenAt as string),
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    retry: 1
  });

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

    if (soundEnabled) void playNotificationSound();
    toast.info(notificationData.unreadCount > 1 ? `${notificationData.unreadCount} order baru masuk` : 'Order baru masuk', {
      description: `${newestOrder.fullName} · ${formatIDR(newestOrder.totalPrice)}`
    });
    void queryClient.invalidateQueries({ queryKey: ['orders'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
  }, [lastSeenAt, query.data, queryClient, soundEnabled]);

  const markAllAsRead = () => {
    const newestCreatedAt = query.data?.latestOrders[0]?.createdAt;
    const nextLastSeenAt = newestCreatedAt || new Date().toISOString();
    try {
      window.localStorage.setItem(LAST_SEEN_KEY, nextLastSeenAt);
    } catch {
      // The in-memory state still keeps notifications usable.
    }
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
    if (nextValue) void playNotificationSound();
  };

  return {
    notifications: query.data?.latestOrders ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    soundEnabled,
    isLoading: query.isLoading,
    isError: query.isError,
    markAllAsRead,
    toggleSound
  };
}
