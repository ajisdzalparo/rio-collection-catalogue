'use client';

import { useMemo } from 'react';
import { useOrders } from './use-orders';
import type { Order } from './use-orders';

export interface CustomerSummary {
  id: string;
  whatsapp: string;
  fullName: string;
  latestAddress: string;
  addresses: string[];
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  orders: Order[];
}

export function useCustomers() {
  const { data: orders = [], isLoading, error } = useOrders();

  const customersList = useMemo(() => {
    const customerMap: Record<string, Order[]> = {};

    // Group orders by WhatsApp number
    orders.forEach((order) => {
      const wa = order.whatsapp.trim();
      if (!customerMap[wa]) {
        customerMap[wa] = [];
      }
      customerMap[wa].push(order);
    });

    // Compute summaries
    const summaries: CustomerSummary[] = Object.entries(customerMap).map(
      ([whatsapp, customerOrders]) => {
        // Sort orders by date desc
        const sortedOrders = [...customerOrders].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Latest order holds the most current contact info
        const latestOrder = sortedOrders[0];

        // Collect unique delivery addresses
        const addressSet = new Set<string>();
        sortedOrders.forEach((o) => {
          if (o.address && o.address.trim()) {
            addressSet.add(o.address.trim());
          }
        });
        const addresses = Array.from(addressSet);

        // Sum spent of PAID or FULFILLED orders
        const totalSpent = customerOrders
          .filter((o) => o.status === 'PAID' || o.status === 'FULFILLED')
          .reduce((sum, o) => sum + o.totalPrice, 0);

        return {
          id: whatsapp,
          whatsapp,
          fullName: latestOrder.fullName,
          latestAddress: latestOrder.address,
          addresses,
          totalOrders: customerOrders.length,
          totalSpent,
          lastOrderDate: latestOrder.createdAt,
          orders: sortedOrders
        };
      }
    );

    // Sort by order count descending
    return summaries.sort((a, b) => b.totalOrders - a.totalOrders);
  }, [orders]);

  return {
    data: customersList,
    isLoading,
    error
  };
}
