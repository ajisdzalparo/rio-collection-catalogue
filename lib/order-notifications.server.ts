import { prisma } from '@/lib/prisma';
import type { OrderNotificationSnapshot } from '@/lib/order-notification-types';

type OrderCreatedListener = () => void;

interface NotificationBrokerGlobal {
  listeners: Set<OrderCreatedListener>;
}

const globalForOrderNotifications = globalThis as unknown as {
  rioOrderNotificationBroker?: NotificationBrokerGlobal;
};

const broker =
  globalForOrderNotifications.rioOrderNotificationBroker ||
  ({ listeners: new Set<OrderCreatedListener>() } satisfies NotificationBrokerGlobal);

globalForOrderNotifications.rioOrderNotificationBroker = broker;

export async function getOrderNotificationSnapshot(
  since: Date
): Promise<OrderNotificationSnapshot> {
  const [unreadCount, latestOrders] = await prisma.$transaction([
    prisma.order.count({ where: { createdAt: { gt: since } } }),
    prisma.order.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 8,
      select: {
        id: true,
        orderNumber: true,
        fullName: true,
        totalPrice: true,
        status: true,
        createdAt: true
      }
    })
  ]);

  return {
    unreadCount,
    latestOrders: latestOrders.map((order) => ({
      ...order,
      createdAt: order.createdAt.toISOString()
    }))
  };
}

export function publishOrderCreated(): void {
  broker.listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error('Error publishing order notification:', error);
    }
  });
}

export function subscribeToOrderCreated(listener: OrderCreatedListener): () => void {
  broker.listeners.add(listener);
  return () => broker.listeners.delete(listener);
}
