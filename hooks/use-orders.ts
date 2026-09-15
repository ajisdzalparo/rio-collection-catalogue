'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export interface OrderItem {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  cogs?: number;
  isPreOrder?: boolean;
}

export type ShippingAdjustmentStatus =
  | 'NONE'
  | 'CUSTOMER_CONFIRMATION_PENDING'
  | 'CUSTOMER_CONFIRMED'
  | 'REFUNDED'
  | 'REFUND_WAIVED';

export interface Order {
  id: string;
  orderNumber: string;
  fullName: string;
  whatsapp: string;
  address: string;
  status:
    | 'PENDING'
    | 'CONFIRMED'
    | 'WAITING_PAYMENT'
    | 'PAID'
    | 'FULFILLED'
    | 'REJECTED'
    | 'CANCELLED'
    | 'EXPIRED';
  waFollowedUp: boolean;
  items: OrderItem[];
  subtotal?: number;
  shippingFee?: number;
  quotedShippingFee?: number;
  shippingAdjustmentAmount?: number;
  shippingAdjustmentStatus?: ShippingAdjustmentStatus;
  shippingAdjustmentNote?: string;
  shippingAdjustmentWaSent?: boolean;
  paymentProofUrl?: string;
  additionalPaymentProofUrl?: string;
  refundProofUrl?: string;
  shippingProofUrl?: string;
  courierName?: string;
  trackingNumber?: string;
  totalPrice: number;
  totalCogs?: number;
  estimatedProfit?: number;
  createdAt: string;
  notes?: string;
  adminNotes?: string;
}

export interface UpdateOrderPayload {
  id: string;
  status?: Order['status'];
  adminNotes?: string;
  courierName?: string;
  trackingNumber?: string;
  waFollowedUp?: boolean;
  shippingFee?: number;
  quotedShippingFee?: number;
  shippingAdjustmentAmount?: number;
  shippingAdjustmentStatus?: ShippingAdjustmentStatus;
  shippingAdjustmentNote?: string;
  shippingAdjustmentWaSent?: boolean;
  paymentProofUrl?: string;
  additionalPaymentProofUrl?: string;
  refundProofUrl?: string;
  shippingProofUrl?: string;
}

const STALE_PENDING_THRESHOLD_MS = 24 * 60 * 60 * 1000;

async function fetchOrders(): Promise<Order[]> {
  const { data } = await axios.get('/api/v1/orders');
  if (data.code !== 200 || !data.data) {
    throw new Error(data.message || 'Invalid orders data received');
  }

  const now = Date.now();
  return (data.data as Order[]).map((order) => {
    const enrichedItems = (order.items || []).map((item) => ({
      ...item,
      cogs: item.cogs
    }));
    const itemsSubtotal = enrichedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const totalCogs = enrichedItems.reduce(
      (acc, item) => acc + (item.cogs ?? 180000) * item.quantity,
      0
    );
    const shippingFee = order.shippingFee ?? 15000;
    const quotedShippingFee = order.quotedShippingFee ?? shippingFee;
    const totalPrice = order.totalPrice ?? itemsSubtotal + shippingFee;
    const subtotal = order.subtotal ?? itemsSubtotal;
    const createdTime = new Date(order.createdAt).getTime();
    const isStale =
      order.status === 'PENDING' && now - createdTime > STALE_PENDING_THRESHOLD_MS;
    const status: Order['status'] = isStale ? 'EXPIRED' : order.status;
    const adminNotes = isStale
      ? order.adminNotes
        ? `${order.adminNotes} (Otomatis Expired via Cron)`
        : 'Otomatis Kadaluarsa via Cron Job (Pending > 24 jam)'
      : order.adminNotes || undefined;

    return {
      ...order,
      status,
      adminNotes,
      items: enrichedItems,
      subtotal,
      shippingFee,
      quotedShippingFee,
      totalPrice,
      totalCogs,
      estimatedProfit: subtotal - totalCogs,
      courierName: order.courierName || undefined,
      trackingNumber: order.trackingNumber || undefined
    };
  });
}

export function useOrders() {
  const queryClient = useQueryClient();
  const query = useQuery<Order[], Error>({ queryKey: ['orders'], queryFn: fetchOrders });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: UpdateOrderPayload) => {
      const { data } = await axios.patch(`/api/v1/orders/${id}`, payload);
      return data.data as Order;
    },
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData<Order[]>(['orders'], (orders) =>
        orders?.map((order) => (order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order))
      );
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    }
  });

  const cleanupCronMutation = useMutation({
    mutationFn: async () => {
      try {
        await axios.get('/api/cron/cleanup-orders');
      } catch {
        // Ignore API proxy error in dev mode.
      }
      return true;
    },
    onSuccess: () => {
      queryClient.setQueryData<Order[]>(['orders'], (old) => {
        if (!Array.isArray(old)) return [];
        const now = Date.now();
        return old.map((order) => {
          const createdTime = new Date(order.createdAt).getTime();
          const isStale =
            order.status === 'PENDING' && now - createdTime > STALE_PENDING_THRESHOLD_MS;
          return isStale
            ? {
                ...order,
                status: 'EXPIRED',
                adminNotes: order.adminNotes
                  ? `${order.adminNotes} (Expired via Cron)`
                  : 'Otomatis Kadaluarsa via Cron Job (Pending > 24 jam)'
              }
            : order;
        });
      });
    }
  });

  const deleteExpiredMutation = useMutation({
    mutationFn: async () => {
      const { data } = await axios.delete('/api/v1/orders/expired');
      return Number(data.data?.deletedCount ?? 0);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    }
  });

  return {
    ...query,
    updateOrder: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    cleanupStaleOrders: cleanupCronMutation.mutateAsync,
    isCleaningUp: cleanupCronMutation.isPending,
    deleteExpiredOrders: deleteExpiredMutation.mutateAsync,
    isDeletingExpired: deleteExpiredMutation.isPending
  };
}
