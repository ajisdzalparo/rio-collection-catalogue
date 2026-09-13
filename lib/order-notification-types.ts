export interface OrderNotification {
  id: string;
  orderNumber: string;
  fullName: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

export interface OrderNotificationSnapshot {
  unreadCount: number;
  latestOrders: OrderNotification[];
}
