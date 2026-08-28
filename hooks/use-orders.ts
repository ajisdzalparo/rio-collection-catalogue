'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { env } from '@/config/env';

export interface OrderItem {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  cogs?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  fullName: string;
  whatsapp: string;
  address: string;
  status: 'PENDING' | 'CONFIRMED' | 'WAITING_PAYMENT' | 'PAID' | 'FULFILLED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
  items: OrderItem[];
  subtotal?: number;
  shippingFee?: number;
  courierName?: string;
  trackingNumber?: string;
  totalPrice: number;
  totalCogs?: number;
  estimatedProfit?: number;
  createdAt: string;
  notes?: string;
  adminNotes?: string;
}

// 24 hours threshold in milliseconds
const STALE_PENDING_THRESHOLD_MS = 24 * 60 * 60 * 1000;

async function fetchOrders(): Promise<Order[]> {
  const { data } = await axios.get(`${env.velomockUrl}/api/v1/orders`);
  if (data.code !== 200 || !data.data) {
    throw new Error(data.message || 'Invalid orders data received');
  }

  const now = Date.now();

  return (data.data as Order[]).map((order) => {
    const enrichedItems = (order.items || []).map((item) => {
      const cogs = item.cogs ?? Math.round(item.price * 0.4);
      return { ...item, cogs };
    });

    const itemsSubtotal = enrichedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const totalCogs = enrichedItems.reduce((acc, item) => acc + (item.cogs ?? 0) * item.quantity, 0);
    const shippingFee = order.shippingFee ?? 15000;
    const courierName = order.courierName ?? 'JNE Express (REG)';
    const trackingNumber = order.trackingNumber ?? (order.status === 'FULFILLED' ? `JNE8820${order.id.slice(-4)}ID` : undefined);
    const totalPrice = order.totalPrice || (itemsSubtotal + shippingFee);
    const subtotal = order.subtotal || itemsSubtotal;
    const estimatedProfit = subtotal - totalCogs;

    // Check if order is stale PENDING (>24 hours old)
    const createdTime = new Date(order.createdAt).getTime();
    const isStale = (order.status === 'PENDING' || order.status === 'WAITING_PAYMENT') && (now - createdTime > STALE_PENDING_THRESHOLD_MS);
    const status: Order['status'] = isStale ? 'EXPIRED' : order.status;
    const adminNotes = isStale
      ? (order.adminNotes ? `${order.adminNotes} (Otomatis Expired via Cron)` : 'Otomatis Kadaluarsa via Cron Job (Pending > 24 jam)')
      : order.adminNotes;

    return {
      ...order,
      status,
      adminNotes,
      items: enrichedItems,
      subtotal,
      shippingFee,
      courierName,
      trackingNumber,
      totalPrice,
      totalCogs,
      estimatedProfit
    };
  });
}

export function useOrders() {
  const queryClient = useQueryClient();

  const query = useQuery<Order[], Error>({
    queryKey: ['orders'],
    queryFn: fetchOrders
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      adminNotes,
      courierName,
      trackingNumber
    }: {
      id: string;
      status: Order['status'];
      adminNotes?: string;
      courierName?: string;
      trackingNumber?: string;
    }) => {
      // Mock network delay & return inputs to update cache
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { id, status, adminNotes, courierName, trackingNumber };
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Order[]>(['orders'], (old) => {
        if (!old) return [];
        return old.map((o) =>
          o.id === data.id
            ? {
                ...o,
                status: data.status,
                adminNotes: data.adminNotes,
                courierName: data.courierName ?? o.courierName,
                trackingNumber: data.trackingNumber ?? o.trackingNumber
              }
            : o
        );
      });
    }
  });

  const cleanupCronMutation = useMutation({
    mutationFn: async () => {
      try {
        await axios.get('/api/cron/cleanup-orders');
      } catch {
        // Ignore API proxy error in dev mode
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
      return true;
    },
    onSuccess: () => {
      queryClient.setQueryData<Order[]>(['orders'], (old) => {
        if (!old) return [];
        const now = Date.now();
        return old.map((o) => {
          const createdTime = new Date(o.createdAt).getTime();
          const isStale = (o.status === 'PENDING' || o.status === 'WAITING_PAYMENT') && (now - createdTime > STALE_PENDING_THRESHOLD_MS);
          if (isStale) {
            return {
              ...o,
              status: 'EXPIRED',
              adminNotes: o.adminNotes ? `${o.adminNotes} (Expired via Cron)` : 'Otomatis Kadaluarsa via Cron Job (Pending > 24 jam)'
            };
          }
          return o;
        });
      });
    }
  });

  return {
    ...query,
    updateOrder: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    cleanupStaleOrders: cleanupCronMutation.mutateAsync,
    isCleaningUp: cleanupCronMutation.isPending
  };
}
