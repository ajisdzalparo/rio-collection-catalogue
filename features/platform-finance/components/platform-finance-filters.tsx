'use client';

import { useState } from 'react';
import { CalendarDays, Check, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { endOfMonth, startOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import type { DateRange } from '@/types/date-picker.types';

export type FinanceStatusFilter = 'ALL' | 'PAID' | 'FULFILLED';

interface PlatformFinanceFiltersProps {
  dateRange: DateRange;
  statusFilter: FinanceStatusFilter;
  onApply: (filters: {
    dateRange: DateRange;
    statusFilter: FinanceStatusFilter;
  }) => void;
  onReset: () => void;
}

export function PlatformFinanceFilters({
  dateRange,
  statusFilter,
  onApply,
  onReset
}: PlatformFinanceFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftDateRange, setDraftDateRange] = useState<DateRange>(dateRange);
  const [draftStatus, setDraftStatus] = useState<FinanceStatusFilter>(statusFilter);
  const activeFilterCount = 1 + (statusFilter === 'ALL' ? 0 : 1);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setDraftDateRange({ from: dateRange.from, to: dateRange.to });
      setDraftStatus(statusFilter);
    }
    setIsOpen(open);
  };

  const handleApply = () => {
    if (draftDateRange.from) {
      onApply({ dateRange: draftDateRange, statusFilter: draftStatus });
    }
    setIsOpen(false);
  };

  const handleReset = () => {
    const currentMonth = {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    };
    setDraftDateRange(currentMonth);
    setDraftStatus('ALL');
    onReset();
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={
          <Button variant="outline" className="h-10 shrink-0 gap-2 rounded-lg text-xs font-semibold">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filter</span>
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          </Button>
        }
      />

      <SheetContent side="right">
        <SheetHeader className="border-b border-border/30 pb-4 pr-8">
          <SheetTitle className="flex items-center gap-2 text-sm font-bold">
            <SlidersHorizontal className="h-4 w-4" />
            Filter Transaksi Finance
          </SheetTitle>
          <SheetDescription className="text-xs">
            Saring komisi berdasarkan periode transaksi dan status pesanan.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 py-5">
          <div className="space-y-3">
            <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              Periode transaksi
            </label>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="finance-start-date" className="text-xs font-semibold text-muted-foreground">
                  Tanggal mulai
                </label>
                <DatePicker
                  id="finance-start-date"
                  ariaLabel="Pilih tanggal mulai transaksi finance"
                  mode="single"
                  value={draftDateRange.from}
                  onChange={(value) =>
                    setDraftDateRange((current) => ({ ...current, from: value }))
                  }
                  maxDate={draftDateRange.to}
                  format="dd MMM yyyy"
                  placeholder="Pilih tanggal mulai"
                  className="h-10 w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="finance-end-date" className="text-xs font-semibold text-muted-foreground">
                  Tanggal akhir
                </label>
                <DatePicker
                  id="finance-end-date"
                  ariaLabel="Pilih tanggal akhir transaksi finance"
                  mode="single"
                  value={draftDateRange.to}
                  onChange={(value) =>
                    setDraftDateRange((current) => ({ ...current, to: value }))
                  }
                  minDate={draftDateRange.from}
                  format="dd MMM yyyy"
                  placeholder="Pilih tanggal akhir"
                  className="h-10 w-full"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="finance-status-filter" className="text-xs font-bold text-foreground">
              Status transaksi
            </label>
            <Select
              value={draftStatus}
              onValueChange={(value) => setDraftStatus(value as FinanceStatusFilter)}
            >
              <SelectTrigger id="finance-status-filter" className="h-10 w-full">
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua status</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="FULFILLED">Fulfilled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="flex-row items-center justify-end gap-2.5 border-t border-border/30 pt-4">
          <Button variant="outline" onClick={handleReset} className="h-9 gap-1.5 rounded-lg text-xs">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
          <Button onClick={handleApply} className="h-9 gap-1.5 rounded-lg text-xs">
            <Check className="h-3.5 w-3.5" />
            Terapkan Filter
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
