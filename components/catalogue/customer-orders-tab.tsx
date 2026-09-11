'use client';

import Link from 'next/link';
import { Package, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCustomerOrders, type CustomerOrder } from '@/hooks/use-customer-account';

import { OrderStatusBadge } from '@/components/catalogue/order-status-badge';

function OrderCard({ order }: { order: CustomerOrder }) {
  return (
    <div className="bg-(--cat-surface-container-low) border border-(--cat-stone) p-5 md:p-6 transition-all hover:border-(--cat-charcoal)/30">
      {/* Top Details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-(--cat-stone)/50 gap-2">
        <div>
          <span className="font-mono text-[12px] font-bold text-(--cat-charcoal)">
            #{order.orderNumber}
          </span>
          <div className="flex items-center gap-2 font-hanken text-[12px] text-(--cat-on-surface-variant) mt-0.5">
            <Clock size={12} />
            <span>
              {new Date(order.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} size="sm" />

          <Link
            href={`/order/confirmation/${order.orderNumber}`}
            className="inline-flex items-center gap-1 font-hanken text-[12px] text-(--cat-charcoal) hover:underline font-semibold"
          >
            Detail <ExternalLink size={12} />
          </Link>
        </div>
      </div>

      {/* Order Items */}
      <div className="py-4 space-y-2">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between items-center font-hanken text-[13px]">
            <span className="text-(--cat-on-surface)">
              {item.name}{' '}
              <span className="text-(--cat-on-surface-variant)">
                ({item.size}) x{item.quantity}
              </span>
            </span>
            <span className="font-semibold text-(--cat-on-surface) tabular-nums">
              {formatPrice(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Footer Total */}
      <div className="pt-3 border-t border-(--cat-stone)/50 flex justify-between items-center">
        <span className="font-hanken text-[12px] text-(--cat-on-surface-variant)">
          Total Pembayaran
        </span>
        <span className="font-hanken text-[16px] font-bold text-(--cat-on-surface) tabular-nums">
          {formatPrice(order.totalPrice)}
        </span>
      </div>
    </div>
  );
}

export function CustomerOrdersTab() {
  const { data: orders = [], isLoading } = useCustomerOrders();

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="animate-spin text-(--cat-charcoal) mx-auto mb-2" size={24} />
        <p className="font-hanken text-[13px] text-(--cat-on-surface-variant)">
          Memuat riwayat pesanan...
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center bg-(--cat-surface-container-low) border border-(--cat-stone) p-8">
        <Package className="mx-auto text-(--cat-stone) mb-3" size={40} />
        <h3 className="font-eb-garamond text-[20px] text-(--cat-on-surface) mb-1">
          Belum Ada Riwayat Pesanan
        </h3>
        <p className="font-hanken text-[13px] text-(--cat-on-surface-variant) max-w-md mx-auto mb-6">
          Pesanan yang Anda buat menggunakan email ini akan otomatis tersinkronisasi di sini.
        </p>
        <Link
          href="/catalogue"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-(--cat-charcoal) text-white font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] hover:opacity-90 transition-opacity"
        >
          Jelajahi Katalog
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
