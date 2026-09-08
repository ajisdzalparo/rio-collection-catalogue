'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ShoppingBag,
  History
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/social-icons';
import { Badge } from '@/components/ui/badge';
import { useCustomers, type CustomerSummary } from '@/hooks/use-customers';
import { VStack } from '@/components/ui/layout';
import { DataTable, type Column } from '@/components/shared/data-table/data-table';
import { TruncatedText } from '@/components/ui/truncated-text';
import { formatIDR, formatWaNumber } from '@/lib/utils';

export default function CustomersCmsPage() {
  const { data: customersList = [], isLoading: loading } = useCustomers();

  // Table Columns Definition for DataTable
  const columns: Column<CustomerSummary>[] = useMemo(
    () => [
      {
        header: 'Pelanggan',
        accessorKey: 'fullName',
        sortable: true,
        cell: (customer) => (
          <Link
            href={`/dashboard/customers/${encodeURIComponent(customer.whatsapp)}`}
            className="font-bold text-xs text-primary hover:underline block max-w-45"
          >
            <TruncatedText
              text={customer.fullName}
              maxWidth="max-w-[180px]"
              className="font-bold text-xs"
            />
          </Link>
        )
      },
      {
        header: 'Nomor WhatsApp',
        accessorKey: 'whatsapp',
        sortable: true,
        cell: (customer) => (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-muted-foreground">+{customer.whatsapp}</span>
            <a
              href={`https://wa.me/${formatWaNumber(customer.whatsapp)}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-emerald-500 hover:text-emerald-600 transition-colors inline-flex items-center"
              title="Chat WhatsApp"
            >
              <WhatsAppIcon size={14} className="h-3.5 w-3.5" />
            </a>
          </div>
        )
      },
      {
        header: 'Total Pesanan',
        accessorKey: 'totalOrders',
        sortable: true,
        cell: (customer) => (
          <div className="flex items-center gap-1.5 font-bold text-xs">
            <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{customer.totalOrders} pesanan</span>
          </div>
        )
      },
      {
        header: 'Total Transaksi Lunas',
        accessorKey: 'totalSpent',
        sortable: true,
        cell: (customer) => (
          <span className="font-extrabold text-xs text-emerald-500 tabular-nums">
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
            <Calendar className="h-3.5 w-3.5 shrink-0" />
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
        className: 'text-right min-w-[100px]',
        cell: (customer) => (
          <Link
            href={`/dashboard/customers/${encodeURIComponent(customer.whatsapp)}`}
            className="h-8 px-3.5 rounded-xl border border-border/60 hover:bg-muted text-xs cursor-pointer inline-flex items-center gap-1.5 font-semibold text-foreground shadow-2xs transition-all hover:scale-[1.02]"
          >
            <History className="h-3.5 w-3.5 text-foreground/70" />
            <span>Riwayat</span>
          </Link>
        )
      }
    ],
    []
  );

  return (
    <VStack gap="lg" className="pb-10 w-full">
      <VStack gap="xs">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Database Pelanggan
        </h1>
        <p className="text-sm text-muted-foreground pt-1">
          Daftar profil pembeli yang diakumulasikan otomatis berdasarkan nomor WhatsApp &amp; riwayat
          transaksi.
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
    </VStack>
  );
}
