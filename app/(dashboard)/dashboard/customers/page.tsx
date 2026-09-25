'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Calendar, ShoppingBag, History, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/social-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import { useCustomers, type CustomerSummary } from '@/hooks/use-customers';
import { VStack } from '@/components/ui/layout';
import { DataTable, type Column } from '@/components/shared/data-table/data-table';
import { TruncatedText } from '@/components/ui/truncated-text';
import { formatIDR, formatWaNumber } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';

const CUSTOMER_TYPE_OPTIONS: MultiSelectOption[] = [
  { value: 'REPEAT', label: 'Pelanggan Setia (> 1 Pesanan)' },
  { value: 'NEW', label: 'Pembeli Pertama (1 Pesanan)' },
  { value: 'VIP', label: 'VIP (Total Transaksi ≥ Rp 500rb)' }
];

export default function CustomersCmsPage() {
  const { data: customersList = [], isLoading: loading } = useCustomers();

  const [appliedTypes, setAppliedTypes] = useState<string[]>([]);
  const [draftTypes, setDraftTypes] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  const handleOpenFilterDrawer = (open: boolean) => {
    if (open) {
      setDraftTypes(appliedTypes);
    }
    setIsFilterOpen(open);
  };

  const handleApplyFilters = () => {
    setAppliedTypes(draftTypes);
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    setDraftTypes([]);
    setAppliedTypes([]);
    setIsFilterOpen(false);
  };

  const activeFilterCount = appliedTypes.length;

  const filteredCustomers = useMemo(() => {
    if (appliedTypes.length === 0) return customersList;
    return customersList.filter((c) => {
      const isRepeat = c.totalOrders > 1;
      const isNew = c.totalOrders === 1;
      const isVip = c.totalSpent >= 500000;

      return appliedTypes.some((type) => {
        if (type === 'REPEAT') return isRepeat;
        if (type === 'NEW') return isNew;
        if (type === 'VIP') return isVip;
        return false;
      });
    });
  }, [customersList, appliedTypes]);

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
            className="h-8 px-3.5 rounded-xl bg-card hover:bg-muted text-xs cursor-pointer inline-flex items-center gap-1.5 font-semibold text-foreground shadow-2xs transition-all"
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
          Daftar profil pembeli yang diakumulasikan otomatis berdasarkan nomor WhatsApp &amp;
          riwayat transaksi.
        </p>
      </VStack>

      {/* Customers DataTable */}
      <DataTable
        columns={columns}
        data={filteredCustomers}
        isLoading={loading}
        searchKey="fullName"
        searchPlaceholder="Cari nama, nomor WhatsApp, atau alamat..."
        emptyTitle="Pelanggan Tidak Ditemukan"
        emptyDescription="Database pelanggan kosong atau tidak cocok dengan pencarian Anda."
        pageSize={10}
        filterComponents={
          <Sheet open={isFilterOpen} onOpenChange={handleOpenFilterDrawer}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  className="h-10 sm:h-9 px-3.5 gap-2 rounded-lg text-xs font-medium cursor-pointer border-border/60 bg-card/60 shadow-2xs hover:bg-muted"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Filter</span>
                  {activeFilterCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              }
            />
            <SheetContent side="right">
              <SheetHeader className="border-b border-border/30 pb-4 pr-8">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-sm font-bold flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>Filter Database Pelanggan</span>
                  </SheetTitle>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Reset All</span>
                    </button>
                  )}
                </div>
                <SheetDescription className="text-xs text-muted-foreground mt-1">
                  Saring data profil pembeli berdasarkan riwayat keaktifan dan total transaksi.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 py-5">
                {/* Customer Type Multi-Filter */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Kategori Pelanggan</Label>
                  <MultiSelect
                    options={CUSTOMER_TYPE_OPTIONS}
                    value={draftTypes}
                    onChange={setDraftTypes}
                    placeholder="Semua Kategori Pelanggan"
                    searchPlaceholder="Cari tipe pelanggan..."
                    emptyText="Tipe tidak ditemukan"
                  />
                </div>
              </div>

              <SheetFooter className="border-t border-border/30 pt-4 flex flex-row items-center justify-end gap-2.5">
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="h-8 text-xs font-medium rounded-xl cursor-pointer gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </Button>
                <Button
                  onClick={handleApplyFilters}
                  className="h-8 text-xs font-medium rounded-xl cursor-pointer"
                >
                  Terapkan Filter
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        }
      />
    </VStack>
  );
}
