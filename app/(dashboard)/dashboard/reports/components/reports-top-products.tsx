import React from 'react';
import { Flame, Trophy, ShoppingBag } from 'lucide-react';
import { formatIDR } from '@/lib/utils';
import type { TopSellingProduct } from './types';

interface ReportsTopProductsProps {
  topProducts: TopSellingProduct[];
  selectedProduct: string;
}

export function ReportsTopProducts({ topProducts, selectedProduct }: ReportsTopProductsProps) {
  return (
    <div className="bg-card border border-border/40 rounded-xl p-5 space-y-4 shadow-2xs w-full">
      <div className="flex items-center justify-between border-b border-border/10 pb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <span>
            {selectedProduct === 'ALL'
              ? 'Top 5 Kaos Terlaris Periode Ini'
              : `Analisis Produk: ${selectedProduct}`}
          </span>
        </h4>
        <span className="text-[10px] font-bold text-muted-foreground uppercase">
          Berdasarkan Kuantitas Terjual
        </span>
      </div>

      {topProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {topProducts.map((p, idx) => {
            const rankBadge =
              idx === 0 ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black tracking-wider">
                  <Trophy className="h-3 w-3" />
                  <span>#1</span>
                </span>
              ) : idx === 1 ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-400/30 bg-slate-400/15 text-slate-600 dark:text-slate-300 text-[10px] font-black tracking-wider">
                  <span>#2</span>
                </span>
              ) : idx === 2 ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-700/30 bg-amber-700/15 text-amber-800 dark:text-amber-500 text-[10px] font-black tracking-wider">
                  <span>#3</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-border/40 bg-muted/40 text-muted-foreground text-[10px] font-bold">
                  <span>#{idx + 1}</span>
                </span>
              );

            return (
              <div
                key={p.name}
                className="w-full border border-border/30 rounded-xl p-3.5 space-y-2.5 bg-card/60 flex flex-col justify-between shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  {rankBadge}
                  <div className="flex items-center gap-1 text-[11px] font-extrabold text-foreground">
                    <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{p.totalQty} Pcs</span>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <h5 className="text-xs font-bold text-foreground line-clamp-1">{p.name}</h5>
                  <p className="text-[11px] font-extrabold text-emerald-500">
                    {formatIDR(p.revenue)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-xs text-muted-foreground">
          Belum ada data kaos terjual pada periode ini.
        </div>
      )}
    </div>
  );
}
