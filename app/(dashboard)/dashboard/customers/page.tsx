'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  ShoppingBag,
  DollarSign,
  Phone,
  MapPin,
  MessageSquare,
  ClipboardList,
  Shirt,
  History
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCustomers, type CustomerSummary } from '@/hooks/use-customers';
import type { Order } from '@/hooks/use-orders';
import { VStack } from '@/components/ui/layout';
import { DataTable, type Column } from '@/components/shared/data-table/data-table';
import { TruncatedText } from '@/components/ui/truncated-text';
import { formatIDR } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

export default function CustomersCmsPage() {
  const { data: customersList = [], isLoading: loading } = useCustomers();

  // Selected customer for modal view
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);

  // Tab state inside dialog: 'orders' | 'items' | 'addresses'
  const [activeTab, setActiveTab] = useState<'orders' | 'items'>('orders');

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            Pending
          </Badge>
        );
      case 'CONFIRMED':
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            Confirmed
          </Badge>
        );
      case 'WAITING_PAYMENT':
        return (
          <Badge
            variant="secondary"
            className="bg-purple-500/10 text-purple-500 border-purple-500/20"
          >
            Waiting Payment
          </Badge>
        );
      case 'PAID':
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]"
          >
            Paid
          </Badge>
        );
      case 'FULFILLED':
        return (
          <Badge
            variant="secondary"
            className="bg-gray-500/10 text-gray-400 border-gray-500/20 text-[10px]"
          >
            Fulfilled
          </Badge>
        );
      case 'REJECTED':
      case 'CANCELLED':
      case 'EXPIRED':
        return (
          <Badge variant="destructive" className="text-[10px]">
            {status}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  const getWhatsAppLink = (whatsapp: string, fullName: string) => {
    const text = `Halo ${fullName},\n\nTerima kasih telah berbelanja di RIO COLLECTION. Ada yang bisa kami bantu?`;
    return `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
  };

  // Summary of items purchased by selected customer across all orders
  const purchasedItemsSummary = useMemo(() => {
    if (!selectedCustomer) return [];
    const itemMap = new Map<
      string,
      { name: string; size: string; totalQty: number; totalSpent: number; orderCount: number }
    >();

    selectedCustomer.orders.forEach((order) => {
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
  }, [selectedCustomer]);

  // Table Columns Definition for DataTable
  const columns: Column<CustomerSummary>[] = useMemo(
    () => [
      {
        header: 'Pelanggan',
        accessorKey: 'fullName',
        sortable: true,
        cell: (customer) => (
          <TruncatedText
            text={customer.fullName}
            maxWidth="max-w-[180px]"
            className="font-semibold text-xs text-foreground"
          />
        )
      },
      {
        header: 'Nomor WhatsApp',
        accessorKey: 'whatsapp',
        sortable: true,
        cell: (customer) => (
          <span className="font-mono text-xs text-muted-foreground">+{customer.whatsapp}</span>
        )
      },
      {
        header: 'Total Pesanan',
        accessorKey: 'totalOrders',
        sortable: true,
        cell: (customer) => (
          <div className="flex items-center gap-1.5 font-bold text-xs">
            <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{customer.totalOrders} kali</span>
          </div>
        )
      },
      {
        header: 'Total Transaksi Lunas',
        accessorKey: 'totalSpent',
        sortable: true,
        cell: (customer) => (
          <span className="font-bold text-xs text-emerald-500">
            {formatIDR(customer.totalSpent)}
          </span>
        )
      },
      {
        header: 'Order Terakhir',
        accessorKey: 'lastOrderDate',
        sortable: true,
        cell: (customer) => (
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {new Date(customer.lastOrderDate).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
        )
      },
      {
        header: 'Alamat Pengiriman',
        className: 'w-full min-w-[220px]',
        cell: (customer) => {
          const totalAddr = customer.addresses.length;
          return (
            <div className="space-y-0.5 max-w-65">
              <TruncatedText
                text={customer.latestAddress}
                maxWidth="max-w-[240px]"
                className="text-xs text-muted-foreground font-normal"
              />
              {totalAddr > 1 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] py-0 px-1 font-semibold text-amber-500 bg-amber-500/10 border-amber-500/20"
                >
                  +{totalAddr - 1} alamat lain
                </Badge>
              )}
            </div>
          );
        }
      },
      {
        header: 'Aksi',
        className: 'text-right',
        cell: (customer) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedCustomer(customer);
              setActiveTab('orders');
            }}
            className="h-8 px-3 rounded-xl border-border/60 hover:bg-muted text-xs cursor-pointer inline-flex items-center gap-1.5 font-semibold shadow-2xs transition-all hover:scale-[1.02]"
          >
            <History className="h-3.5 w-3.5 text-foreground/70" />
            <span>Riwayat</span>
          </Button>
        )
      }
    ],
    []
  );

  return (
    <VStack gap="lg" className="pb-10">
      <VStack gap="xs">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Database Pelanggan
        </h1>
        <p className="text-sm text-muted-foreground pt-1">
          Daftar profil pembeli yang diakumulasikan otomatis berdasarkan nomor WhatsApp & riwayat
          transaksi
        </p>
      </VStack>

      {/* Customers DataTable */}
      <DataTable
        columns={columns}
        data={customersList}
        isLoading={loading}
        searchKey="fullName"
        searchPlaceholder="Cari nama, nomor WhatsApp, atau alamat..."
        emptyTitle="Pelanggan Tidak Ditemukan"
        emptyDescription="Database pelanggan kosong atau tidak cocok dengan pencarian Anda."
        pageSize={10}
      />

      {/* Customer Order History Dialog */}
      <Dialog
        open={selectedCustomer !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedCustomer(null);
        }}
      >
        {selectedCustomer && (
          <DialogContent className="max-w-4xl max-h-[85vh] bg-card border-border/40 rounded-2xl flex flex-col p-6 overflow-hidden">
            <DialogHeader className="border-b border-border/20 pb-4 shrink-0">
              <DialogTitle className="text-lg font-extrabold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span>Profil Pelanggan: {selectedCustomer.fullName}</span>
                </div>
                <Badge variant="outline" className="font-mono text-xs font-semibold">
                  +{selectedCustomer.whatsapp}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs pt-1">
                Akumulasi riwayat transaksi, barang yang dibeli, dan variasi alamat pengiriman
                berdasarkan nomor WhatsApp
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-1">
              {/* Customer summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/10 p-4 rounded-xl border border-border/20">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    WhatsApp Pelanggan
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-bold text-foreground font-mono">
                      +{selectedCustomer.whatsapp}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Total Pembelanjaan Lunas
                  </span>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-500">
                      {formatIDR(selectedCustomer.totalSpent)} ({selectedCustomer.totalOrders}{' '}
                      order)
                    </span>
                  </div>
                </div>
                <div className="space-y-1 sm:col-span-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-amber-500" /> Total Alamat Pengiriman
                  </span>
                  <p className="text-xs text-foreground font-bold">
                    {selectedCustomer.addresses.length} Alamat Berbeda Terdaftar
                  </p>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-border/20 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'orders'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  <span>Riwayat Transaksi ({selectedCustomer.orders.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('items')}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'items'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Shirt className="h-3.5 w-3.5" />
                  <span>Ringkasan Kaos Dibeli ({purchasedItemsSummary.length})</span>
                </button>
              </div>

              {/* TAB 1: Tabel Riwayat Transaksi (termasuk Alamat Spesifik per Order) */}
              {activeTab === 'orders' && (
                <div className="space-y-3">
                  <div className="overflow-x-auto border border-border/30 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/30">
                          <th className="py-3 px-4 font-bold">No. Order & Tanggal</th>
                          <th className="py-3 px-4 font-bold">Items / Kaos Yang Dipesan</th>
                          <th className="py-3 px-4 font-bold">Alamat Kirim Spesifik</th>
                          <th className="py-3 px-4 font-bold">Status</th>
                          <th className="py-3 px-4 font-bold text-right">Total Order</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {selectedCustomer.orders.map((order) => (
                          <tr
                            key={order.id}
                            className="hover:bg-muted/10 transition-colors align-top"
                          >
                            <td className="py-3 px-4 font-mono font-bold text-foreground whitespace-nowrap">
                              <div>{order.orderNumber}</div>
                              <div className="text-[10px] text-muted-foreground font-normal mt-0.5 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(order.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                            </td>
                            <td className="py-3 px-4 min-w-50">
                              <div className="space-y-1.5">
                                {order.items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between text-xs gap-3"
                                  >
                                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                                      {item.name}
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] py-0 px-1 font-mono"
                                      >
                                        {item.size}
                                      </Badge>
                                    </span>
                                    <span className="text-muted-foreground text-[11px] whitespace-nowrap font-medium">
                                      x{item.quantity} ({formatIDR(item.price * item.quantity)})
                                    </span>
                                  </div>
                                ))}
                                {order.adminNotes && (
                                  <p className="text-[10px] text-amber-500/90 bg-amber-500/10 p-1.5 rounded mt-1 border border-amber-500/20">
                                    <span className="font-bold">Catatan:</span> {order.adminNotes}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 min-w-50">
                              <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                <span className="text-[11px] leading-relaxed text-foreground font-medium">
                                  {order.address || 'Tanpa alamat'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {getStatusBadge(order.status)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-foreground whitespace-nowrap">
                              {formatIDR(order.totalPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: Tabel Ringkasan Kaos Pernah Dibeli */}
              {activeTab === 'items' && (
                <div className="space-y-3">
                  <div className="overflow-x-auto border border-border/30 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/30">
                          <th className="py-3 px-4 font-bold">Nama Kaos / Produk</th>
                          <th className="py-3 px-4 font-bold">Ukuran</th>
                          <th className="py-3 px-4 font-bold text-center">Total Qty Dibeli</th>
                          <th className="py-3 px-4 font-bold text-center">Jumlah Transaksi</th>
                          <th className="py-3 px-4 font-bold text-right">Total Akumulasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {purchasedItemsSummary.length > 0 ? (
                          purchasedItemsSummary.map((item, idx) => (
                            <tr key={idx} className="hover:bg-muted/10 transition-colors">
                              <td className="py-3 px-4 font-semibold text-foreground flex items-center gap-2">
                                <Shirt className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span>{item.name}</span>
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant="outline" className="text-[10px] font-mono">
                                  {item.size}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-foreground">
                                {item.totalQty} pcs
                              </td>
                              <td className="py-3 px-4 text-center text-muted-foreground">
                                {item.orderCount} kali
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-emerald-500">
                                {formatIDR(item.totalSpent)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={5}
                              className="py-8 text-center text-muted-foreground text-xs"
                            >
                              Belum ada data barang yang dibeli
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-border/20 pt-4 gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={() => setSelectedCustomer(null)}
                className="h-10 rounded-xl text-xs cursor-pointer"
              >
                Tutup
              </Button>
              <a
                href={getWhatsAppLink(selectedCustomer.whatsapp, selectedCustomer.fullName)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 h-10 px-4 text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all cursor-pointer select-none"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Hubungi WA (+{selectedCustomer.whatsapp})</span>
              </a>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </VStack>
  );
}
