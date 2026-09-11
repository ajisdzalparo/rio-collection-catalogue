'use client';

import React, { useState, useMemo, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Phone,
  MapPin,
  ClipboardList,
  Shirt,
  ExternalLink,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/social-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCustomers } from '@/hooks/use-customers';
import { formatIDR } from '@/lib/utils';
import { OrderStatusBadge } from '@/components/shared/order-status-badge';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const decodedId = decodeURIComponent(id);

  const { data: customersList = [], isLoading: loading } = useCustomers();
  const [activeTab, setActiveTab] = useState<'orders' | 'items' | 'addresses'>('orders');

  const customer = useMemo(() => {
    return (
      customersList.find(
        (c) =>
          c.whatsapp === decodedId ||
          c.whatsapp.replace(/[^0-9]/g, '') === decodedId.replace(/[^0-9]/g, '') ||
          c.fullName.toLowerCase() === decodedId.toLowerCase()
      ) || null
    );
  }, [customersList, decodedId]);

  const getWhatsAppLink = (whatsapp: string, fullName: string) => {
    const text = `Halo ${fullName},\n\nTerima kasih telah berbelanja di RIO COLLECTION. Ada yang bisa kami bantu?`;
    return `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
  };

  // Summary of items purchased by customer across all orders
  const purchasedItemsSummary = useMemo(() => {
    if (!customer) return [];
    const itemMap = new Map<
      string,
      { name: string; size: string; totalQty: number; totalSpent: number; orderCount: number }
    >();

    customer.orders.forEach((order) => {
      order.items.forEach((item) => {
        const key = `${item.name}-${item.size}`;
        const existing = itemMap.get(key);
        if (existing) {
          existing.totalQty += item.quantity;
          existing.totalSpent += item.price * item.quantity;
          existing.orderCount += 1;
        } else {
          itemMap.set(key, {
            name: item.name,
            size: item.size,
            totalQty: item.quantity,
            totalSpent: item.price * item.quantity,
            orderCount: 1
          });
        }
      });
    });

    return Array.from(itemMap.values()).sort((a, b) => b.totalQty - a.totalQty);
  }, [customer]);

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse font-medium">
          Memuat data profil pelanggan...
        </p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center text-center p-6 space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h3 className="text-xl font-bold text-foreground">Pelanggan Tidak Ditemukan</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Data pelanggan &quot;{decodedId}&quot; tidak ditemukan dalam database.
        </p>
        <Button
          onClick={() => router.push('/dashboard/customers')}
          className="rounded-xl font-bold text-xs"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          <span>Kembali ke Database Pelanggan</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
            <Link
              href="/dashboard/customers"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Database Pelanggan</span>
            </Link>
            <span>/</span>
            <span className="text-foreground font-bold">{customer.fullName}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap pt-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {customer.fullName}
            </h1>
            <Badge
              variant="outline"
              className="font-mono text-xs font-semibold px-2.5 py-1 rounded-xl"
            >
              +{customer.whatsapp}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Akumulasi profil pembeli dan riwayat transaksi berdasarkan nomor WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={getWhatsAppLink(customer.whatsapp, customer.fullName)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <WhatsAppIcon size={16} className="h-4 w-4" />
            <span>Chat WhatsApp (+{customer.whatsapp})</span>
          </a>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/customers')}
            className="h-10 rounded-lg text-xs font-bold border-border/60"
          >
            Kembali ke Daftar
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border/40 rounded-xl p-5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Total Pembelanjaan Lunas
            </span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-emerald-500 tabular-nums">
            {formatIDR(customer.totalSpent)}
          </h3>
          <p className="text-xs text-muted-foreground">
            {customer.totalOrders} kali pesanan selesai
          </p>
        </div>

        <div className="bg-card border border-border/40 rounded-xl p-5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Kontak WhatsApp
            </span>
            <Phone className="h-4 w-4 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold font-mono text-foreground pt-0.5">
            +{customer.whatsapp}
          </h3>
          <p className="text-xs text-muted-foreground">Nomor utama pembeli</p>
        </div>

        <div className="bg-card border border-border/40 rounded-xl p-5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Alamat Terdaftar
            </span>
            <MapPin className="h-4 w-4 text-amber-500" />
          </div>
          <h3 className="text-2xl font-black text-foreground">
            {customer.addresses.length} Alamat
          </h3>
          <p className="text-xs text-muted-foreground truncate">{customer.latestAddress}</p>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-card border border-border/40 rounded-xl p-3.5 sm:p-6 shadow-xs space-y-4 sm:space-y-5">
        <div className="flex items-center gap-1.5 border-b border-border/20 pb-3 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-foreground text-background shadow-xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Riwayat Transaksi ({customer.orders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'items'
                ? 'bg-foreground text-background shadow-xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <Shirt className="h-3.5 w-3.5" />
            <span>Ringkasan Kaos Dibeli ({purchasedItemsSummary.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('addresses')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'addresses'
                ? 'bg-foreground text-background shadow-xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Daftar Alamat ({customer.addresses.length})</span>
          </button>
        </div>

        {/* TAB 1: Riwayat Transaksi */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {/* Mobile Adaptive Cards View (Screen < md) */}
            <div className="md:hidden space-y-3">
              {customer.orders.map((o) => (
                <div
                  key={o.id}
                  className="p-4 rounded-lg border border-border/60 bg-muted/15 space-y-3 shadow-xs"
                >
                  {/* Top: Order #, Date & Status */}
                  <div className="flex items-start justify-between gap-2 border-b border-border/20 pb-2.5">
                    <div>
                      <Link
                        href={`/dashboard/orders/${o.id}`}
                        className="font-mono font-bold text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <span>#{o.orderNumber}</span>
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </Link>
                      <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(o.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    <OrderStatusBadge status={o.status} />
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5 py-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Item Kaos Dipesan:
                    </span>
                    {o.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs gap-2">
                        <span className="font-semibold text-foreground flex items-center gap-1.5 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                          <span className="truncate">{item.name}</span>
                          <Badge
                            variant="outline"
                            className="text-[9px] py-0 px-1 font-mono shrink-0"
                          >
                            {item.size}
                          </Badge>
                        </span>
                        <span className="text-muted-foreground text-[11px] shrink-0 font-medium">
                          x{item.quantity} ({formatIDR(item.price * item.quantity)})
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Shipping Address */}
                  {o.address && (
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground pt-1.5 border-t border-border/20">
                      <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-relaxed text-foreground font-medium line-clamp-2">
                        {o.address}
                      </span>
                    </div>
                  )}

                  {/* Bottom: Total & Action */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-border/20">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Total Tagihan:
                      </span>
                      <span className="text-sm font-black text-foreground">
                        {formatIDR(o.totalPrice)}
                      </span>
                    </div>
                    <Link
                      href={`/dashboard/orders/${o.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/15 rounded-md transition-colors"
                    >
                      <span>Detail</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (Screen >= md) */}
            <div className="hidden md:block overflow-x-auto border border-border/30 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/30">
                    <th className="py-3 px-4 font-bold">No. Order &amp; Tanggal</th>
                    <th className="py-3 px-4 font-bold">Item Kaos Dipesan</th>
                    <th className="py-3 px-4 font-bold">Alamat Pengiriman</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Total Tagihan</th>
                    <th className="py-3 px-4 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {customer.orders.map((o) => (
                    <tr key={o.id} className="hover:bg-muted/10 transition-colors align-top">
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground whitespace-nowrap">
                        <Link
                          href={`/dashboard/orders/${o.id}`}
                          className="hover:underline text-primary flex items-center gap-1"
                        >
                          <span>#{o.orderNumber}</span>
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </Link>
                        <div className="text-[10px] text-muted-foreground font-normal mt-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(o.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 min-w-50">
                        <div className="space-y-1">
                          {o.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs gap-3"
                            >
                              <span className="font-semibold text-foreground flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                                <span>{item.name}</span>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] py-0 px-1 font-mono"
                                >
                                  {item.size}
                                </Badge>
                              </span>
                              <span className="text-muted-foreground text-[11px] whitespace-nowrap">
                                x{item.quantity} ({formatIDR(item.price * item.quantity)})
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-60">
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span className="text-[11px] leading-relaxed text-foreground font-medium">
                            {o.address || 'Tanpa alamat'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-foreground whitespace-nowrap">
                        {formatIDR(o.totalPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/dashboard/orders/${o.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                        >
                          <span>Detail</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Ringkasan Kaos Dibeli */}
        {activeTab === 'items' && (
          <div className="space-y-3">
            {/* Mobile Adaptive Cards View (Screen < md) */}
            <div className="md:hidden space-y-3">
              {purchasedItemsSummary.length > 0 ? (
                purchasedItemsSummary.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 sm:p-4 rounded-lg border border-border/60 bg-muted/15 space-y-2.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-md bg-muted/60 text-muted-foreground shrink-0">
                          <Shirt className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                            {item.name}
                          </h4>
                          <span className="text-[10px] text-muted-foreground">
                            Dibeli {item.orderCount} kali
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                        Ukuran {item.size}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-md bg-card border border-border/20 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Total Kuantitas:
                        </span>
                        <span className="font-bold text-foreground">{item.totalQty} pcs</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Akumulasi Belanja:
                        </span>
                        <span className="font-black text-emerald-500">
                          {formatIDR(item.totalSpent)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-muted-foreground text-xs rounded-lg border border-border/30 bg-muted/10">
                  Belum ada data barang yang dibeli.
                </div>
              )}
            </div>

            {/* Desktop Table View (Screen >= md) */}
            <div className="hidden md:block overflow-x-auto border border-border/30 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/30">
                    <th className="py-3 px-4 font-bold">Nama Kaos / Produk</th>
                    <th className="py-3 px-4 font-bold">Ukuran</th>
                    <th className="py-3 px-4 font-bold text-center">Total Kuantitas</th>
                    <th className="py-3 px-4 font-bold text-center">Frekuensi Pembelian</th>
                    <th className="py-3 px-4 font-bold text-right">Total Akumulasi Belanja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {purchasedItemsSummary.length > 0 ? (
                    purchasedItemsSummary.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/10 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-foreground flex items-center gap-2">
                          <Shirt className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>{item.name}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {item.size}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-foreground">
                          {item.totalQty} pcs
                        </td>
                        <td className="py-3.5 px-4 text-center text-muted-foreground">
                          {item.orderCount} kali
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-emerald-500">
                          {formatIDR(item.totalSpent)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                        Belum ada data barang yang dibeli.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Daftar Alamat */}
        {activeTab === 'addresses' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {customer.addresses.map((addr, idx) => (
              <div
                key={idx}
                className="p-4 bg-muted/15 border border-border/30 rounded-lg space-y-1.5 flex items-start gap-3"
              >
                <div className="p-2 rounded-md bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Alamat #{idx + 1}</span>
                    {idx === 0 && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] bg-primary/10 text-primary font-bold"
                      >
                        Terbaru
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">{addr}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
