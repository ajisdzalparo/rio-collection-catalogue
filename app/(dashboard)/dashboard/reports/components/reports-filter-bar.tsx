import React, { useMemo } from 'react';
import { Filter, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import type { DateRange, DatePickerPreset } from '@/types/date-picker.types';
import { subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

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

interface ReportsFilterBarProps {
  selectedProduct: string;
  onProductChange: (product: string) => void;
  availableProducts: string[];
  startDate: string;
  endDate: string;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onExportExcel: () => void;
}

export function ReportsFilterBar({
  selectedProduct,
  onProductChange,
  availableProducts,
  startDate,
  endDate,
  onDateRangeChange,
  onExportExcel
}: ReportsFilterBarProps) {
  const rangeValue: DateRange = useMemo(() => {
    return {
      from: startDate ? new Date(startDate + 'T00:00:00') : undefined,
      to: endDate ? new Date(endDate + 'T23:59:59') : undefined
    };
  }, [startDate, endDate]);

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/40 pb-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Laporan Keuangan & Penjualan
          </h1>
          {selectedProduct !== 'ALL' && (
            <Badge
              variant="secondary"
              className="text-xs font-bold bg-primary/10 text-primary border-primary/20"
            >
              Filter: {selectedProduct}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Ringkasan performa bisnis dan analisis tren produk berdasarkan rentang tanggal.
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
        {/* Product Filter */}
        <div className="flex items-center gap-2 bg-card border border-border/40 rounded-lg px-2.5 py-1 shadow-2xs">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Select value={selectedProduct} onValueChange={(val) => val && onProductChange(val)}>
            <SelectTrigger className="h-8 border-none bg-transparent shadow-none text-xs font-semibold min-w-32 max-w-44 focus:ring-0">
              <SelectValue placeholder="Semua Produk" />
            </SelectTrigger>
            <SelectContent className="rounded-lg max-h-60">
              <SelectItem value="ALL">Semua Produk Kaos</SelectItem>
              {availableProducts.map((pName) => (
                <SelectItem key={pName} value={pName}>
                  {pName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Themed Date Range Picker with Indonesian Presets */}
        <div className="w-auto">
          <DatePicker
            mode="range"
            size="sm"
            align="right"
            rangeValue={rangeValue}
            onRangeChange={onDateRangeChange}
            showPresets={true}
            presets={INDONESIAN_PRESETS}
            placeholder="Pilih rentang tanggal..."
            className="w-auto min-w-56"
          />
        </div>

        {/* Export to Excel Button */}
        <Button
          onClick={onExportExcel}
          className="gap-2 h-8 rounded-lg px-3.5 font-semibold text-xs shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          <span>Ekspor Excel (.xlsx)</span>
        </Button>
      </div>
    </div>
  );
}
