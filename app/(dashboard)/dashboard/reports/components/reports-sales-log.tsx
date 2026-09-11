import React from 'react';
import Link from 'next/link';
import { Receipt } from 'lucide-react';
import { formatIDR } from '@/lib/utils';
import type { Order } from '@/hooks/use-orders';

interface ReportsSalesLogProps {
  currentOrders: Order[];
  selectedProduct: string;
}

export function ReportsSalesLog({ currentOrders, selectedProduct }: ReportsSalesLogProps) {
  const filteredOrderCount = currentOrders.filter((o) =>
    o.items.some((item) => selectedProduct === 'ALL' || item.name === selectedProduct)
  ).length;

  return (
    <div className="bg-card border border-border/40 rounded-xl p-5 flex flex-col space-y-4 shadow-xs h-full">
      <div className="flex items-center justify-between border-b border-border/10 pb-3 shrink-0">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          <span>Catatan Rincian Penjualan</span>
        </h4>
        <span className="text-[10px] font-bold text-muted-foreground uppercase">
          {filteredOrderCount} Pesanan
        </span>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto max-h-115 pr-1">
        {currentOrders.map((o) => {
          const matchingItems = o.items.filter(
            (item) => selectedProduct === 'ALL' || item.name === selectedProduct
          );
          if (matchingItems.length === 0) return null;

          let orderRevenue = 0;
          let orderHpp = 0;
          matchingItems.forEach((item) => {
            orderRevenue += item.price * item.quantity;
            orderHpp += (item.cogs || 180000) * item.quantity;
          });
          const profit = orderRevenue - orderHpp;

          return (
            <Link
              key={o.id}
              href={`/dashboard/orders/${o.id}`}
              className="block border border-border/25 p-3.5 rounded-lg space-y-2 bg-muted/15 hover:bg-muted/30 hover:border-primary/30 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="font-mono text-primary group-hover:underline">{o.orderNumber}</span>
                <span className="text-muted-foreground">
                  {new Date(o.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </span>
              </div>
              <div className="space-y-1">
                {matchingItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground truncate max-w-36">{item.name}</span>
                    <span className="font-bold text-foreground">x{item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between border-t border-border/15 pt-1.5 text-[11px] font-bold">
                <span className="text-muted-foreground">Untung:</span>
                <span className="text-emerald-500 font-extrabold">{formatIDR(profit)}</span>
              </div>
            </Link>
          );
        })}

        {filteredOrderCount === 0 && (
          <div className="text-center py-6 text-xs text-muted-foreground">
            Belum ada order pada filter produk & periode ini.
          </div>
        )}
      </div>
    </div>
  );
}
