import React, { useMemo } from 'react';
import { CalendarDays, FileSpreadsheet, PackageSearch, SlidersHorizontal } from 'lucide-react';
import { subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import type { DateRange, DatePickerPreset } from '@/types/date-picker.types';
import type { ReportStatus } from './types';

const INDONESIAN_PRESETS: DatePickerPreset[] = [
  {
    label: 'Hari Ini',
    getValue: () => {
      const today = new Date();
      return { from: today, to: today };
    }
  },
  {
    label: '7 Hari Terakhir',
    getValue: () => {
      const today = new Date();
      return { from: subDays(today, 6), to: today };
    }
  },
  {
    label: '30 Hari Terakhir',
    getValue: () => {
      const today = new Date();
      return { from: subDays(today, 29), to: today };
    }
  },
  {
    label: 'Bulan Ini',
    getValue: () => {
      const today = new Date();
      return { from: startOfMonth(today), to: endOfMonth(today) };
    }
  },
  {
    label: 'Bulan Lalu',
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }
  }
];

const STATUS_OPTIONS: MultiSelectOption[] = [
  { value: 'PAID', label: 'Lunas', colorDot: 'bg-emerald-500' },
  { value: 'FULFILLED', label: 'Dikirim', colorDot: 'bg-blue-500' }
];

interface ReportsFilterBarProps {
  selectedProducts: string[];
  onProductsChange: (products: string[]) => void;
  selectedStatuses: ReportStatus[];
  onStatusesChange: (statuses: ReportStatus[]) => void;
  availableProducts: string[];
  startDate: string;
  endDate: string;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onExportExcel: () => void;
}

export function ReportsFilterBar({
  selectedProducts,
  onProductsChange,
  selectedStatuses,
  onStatusesChange,
  availableProducts,
  startDate,
  endDate,
  onDateRangeChange,
  onExportExcel
}: ReportsFilterBarProps) {
  const rangeValue: DateRange = useMemo(
    () => ({
      from: startDate ? new Date(`${startDate}T00:00:00`) : undefined,
      to: endDate ? new Date(`${endDate}T23:59:59`) : undefined
    }),
    [startDate, endDate]
  );
  const productOptions = useMemo<MultiSelectOption[]>(
    () => availableProducts.map((product) => ({ value: product, label: product })),
    [availableProducts]
  );

  return (
    <div className="space-y-5 border-b border-border/40 pb-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          Laporan Keuangan &amp; Penjualan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ringkasan dan rincian transaksi yang sudah masuk sebagai penjualan.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto] items-end gap-3 w-full min-w-0">
        <div className="space-y-1.5 min-w-0">
          <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <PackageSearch className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>Produk</span>
          </label>
          <MultiSelect
            options={productOptions}
            value={selectedProducts}
            onChange={onProductsChange}
            placeholder="Semua produk"
            searchPlaceholder="Cari produk..."
            emptyText="Produk tidak ditemukan"
            maxCount={1}
          />
        </div>

        <div className="space-y-1.5 min-w-0">
          <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>Periode</span>
          </label>
          <DatePicker
            mode="range"
            align="left"
            rangeValue={rangeValue}
            onRangeChange={onDateRangeChange}
            showPresets
            presets={INDONESIAN_PRESETS}
            placeholder="Pilih rentang tanggal"
            className="h-10 w-full"
          />
        </div>

        <div className="space-y-1.5 min-w-0">
          <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>Status</span>
          </label>
          <MultiSelect
            options={STATUS_OPTIONS}
            value={selectedStatuses}
            onChange={(values) => onStatusesChange(values as ReportStatus[])}
            placeholder="Semua status penjualan"
            searchPlaceholder="Cari status..."
            maxCount={2}
          />
        </div>

        <Button
          onClick={onExportExcel}
          className="h-10 gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700 shrink-0 w-full sm:w-auto"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Ekspor Excel</span>
        </Button>
      </div>
    </div>
  );
}
