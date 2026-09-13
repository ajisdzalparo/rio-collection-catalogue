'use client';

import { useState } from 'react';
import { CalendarDays, Check, RotateCcw, SlidersHorizontal } from 'lucide-react';
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
import type { ActivityLogFilters } from '../types';

const DEFAULT_FILTERS: ActivityLogFilters = { action: 'ALL', module: 'ALL' };

interface ActivityLogFiltersProps {
  filters: ActivityLogFilters;
  onApply: (filters: ActivityLogFilters) => void;
}

export function ActivityLogFilterDrawer({ filters, onApply }: ActivityLogFiltersProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ActivityLogFilters>(filters);
  const activeCount = Number(filters.action !== 'ALL') + Number(filters.module !== 'ALL') +
    Number(Boolean(filters.startDate || filters.endDate));

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setDraft(filters);
    setOpen(nextOpen);
  };

  const reset = () => {
    setDraft(DEFAULT_FILTERS);
    onApply(DEFAULT_FILTERS);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger render={<Button variant="outline" className="h-10 gap-2 rounded-lg text-xs font-semibold" />}>
        <SlidersHorizontal className="h-4 w-4" />
        Filter
        {activeCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
            {activeCount}
          </span>
        )}
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader className="border-b border-border/40 pb-4 pr-8">
          <SheetTitle className="flex items-center gap-2 text-sm font-bold">
            <SlidersHorizontal className="h-4 w-4" /> Filter Activity Log
          </SheetTitle>
          <SheetDescription className="text-xs">Filter baru aktif setelah tombol Terapkan Filter ditekan.</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 py-5">
          <div className="space-y-1.5">
            <label htmlFor="activity-module" className="text-xs font-bold">Modul</label>
            <Select
              value={draft.module}
              onValueChange={(module) =>
                module && setDraft((value) => ({ ...value, module }))
              }
            >
              <SelectTrigger id="activity-module" className="h-10 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['ALL', 'AUTH', 'USERS', 'ORDERS', 'PRODUCTS', 'JOURNALS', 'SETTINGS', 'FINANCE'].map((value) => (
                  <SelectItem key={value} value={value}>{value === 'ALL' ? 'Semua modul' : value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="activity-action" className="text-xs font-bold">Aktivitas</label>
            <Select
              value={draft.action}
              onValueChange={(action) =>
                action && setDraft((value) => ({ ...value, action }))
              }
            >
              <SelectTrigger id="activity-action" className="h-10 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['ALL', 'LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'PASSWORD_RESET', 'STATUS_CHANGE', 'SETTINGS_UPDATE'].map((value) => (
                  <SelectItem key={value} value={value}>{value === 'ALL' ? 'Semua aktivitas' : value.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <p className="flex items-center gap-1.5 text-xs font-bold"><CalendarDays className="h-3.5 w-3.5" /> Periode</p>
            <div className="space-y-1.5">
              <label htmlFor="activity-start-date" className="text-xs text-muted-foreground">Tanggal mulai</label>
              <DatePicker id="activity-start-date" ariaLabel="Pilih tanggal mulai activity log" mode="single" value={draft.startDate} onChange={(startDate) => setDraft((value) => ({ ...value, startDate }))} maxDate={draft.endDate} className="h-10 w-full" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="activity-end-date" className="text-xs text-muted-foreground">Tanggal akhir</label>
              <DatePicker id="activity-end-date" ariaLabel="Pilih tanggal akhir activity log" mode="single" value={draft.endDate} onChange={(endDate) => setDraft((value) => ({ ...value, endDate }))} minDate={draft.startDate} className="h-10 w-full" />
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-border/40 pt-4">
          <Button variant="outline" onClick={reset} className="h-9 gap-1.5 text-xs"><RotateCcw className="h-3.5 w-3.5" />Reset</Button>
          <Button onClick={() => { onApply(draft); setOpen(false); }} className="h-9 gap-1.5 text-xs"><Check className="h-3.5 w-3.5" />Terapkan Filter</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
