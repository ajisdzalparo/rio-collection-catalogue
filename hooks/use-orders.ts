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
  discountAmount?: number;
  referralCodeSnapshot?: string | null;
  referralPartnerSnapshot?: string | null;
  referralRewardKind?: string | null;
  referralRewardAmount?: number;
  referralPayoutId?: string | null;
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

export interface UseOrdersParams {
  search?: string;
  status?: string[];
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface OrdersMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const STALE_PENDING_THRESHOLD_MS = 24 * 60 * 60 * 1000;

function enrichOrder(order: Order): Order {
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
  const now = Date.now();
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
    estimatedProfit: subtotal - (order.discountAmount ?? 0) - totalCogs,
    courierName: order.courierName || undefined,
    trackingNumber: order.trackingNumber || undefined
  };
}

async function fetchOrders(
  params?: UseOrdersParams
): Promise<{ orders: Order[]; meta: OrdersMeta }> {
  const queryParams: Record<string, string> = {};

  if (params?.search) queryParams.search = params.search;
  if (params?.status && params.status.length > 0) queryParams.status = params.status.join(',');
  if (params?.startDate) queryParams.startDate = params.startDate;
  if (params?.endDate) queryParams.endDate = params.endDate;
  if (params?.page) queryParams.page = String(params.page);
  if (params?.pageSize) queryParams.pageSize = String(params.pageSize);

  const { data } = await axios.get('/api/v1/orders', { params: queryParams });
  if (data.code !== 200 || !data.data) {
    throw new Error(data.message || 'Invalid orders data received');
  }

  const orders = (data.data as Order[]).map(enrichOrder);
  const meta: OrdersMeta = data.meta ?? {
    page: 1,
    pageSize: orders.length,
    total: orders.length,
    totalPages: 1
  };

  return { orders, meta };
}

export function useOrders(params?: UseOrdersParams) {
  const queryClient = useQueryClient();

  const queryKey = [
    'orders',
    params?.search || '',
    params?.status?.join(',') || '',
    params?.startDate || '',
    params?.endDate || '',
    params?.page || 1,
    params?.pageSize || ''
  ];

  const query = useQuery<{ orders: Order[]; meta: OrdersMeta }, Error>({
    queryKey,
    queryFn: () => fetchOrders(params)
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: UpdateOrderPayload) => {
      const { data } = await axios.patch(`/api/v1/orders/${id}`, payload);
      return data.data as Order;
    },
    onSuccess: () => {
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
      queryClient.invalidateQueries({ queryKey: ['orders'] });
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
    data: query.data?.orders ?? [],
    meta: query.data?.meta ?? { page: 1, pageSize: 10, total: 0, totalPages: 1 },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateOrder: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    cleanupStaleOrders: cleanupCronMutation.mutateAsync,
    isCleaningUp: cleanupCronMutation.isPending,
    deleteExpiredOrders: deleteExpiredMutation.mutateAsync,
    isDeletingExpired: deleteExpiredMutation.isPending
  };
}
