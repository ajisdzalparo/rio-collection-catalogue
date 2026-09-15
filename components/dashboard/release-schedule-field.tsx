'use client';

import * as React from 'react';
import { addDays } from 'date-fns';
import { CalendarDays, Clock3, RotateCcw, Timer, Layers } from 'lucide-react';
import { CountdownTimer } from '@/components/catalogue/countdown-timer';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { TimePicker } from '@/components/ui/time-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { StockMode } from '@/types/catalogue.types';

const WIB_TIME_ZONE = 'Asia/Jakarta';
const DEFAULT_RELEASE_TIME = '19:00';

interface ReleaseScheduleFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
  stockMode?: StockMode;
  onStockModeChange?: (mode: StockMode) => void;
}

interface ScheduleParts {
  date?: Date;
  time: string;
}

function getWibParts(value: string | Date): ScheduleParts {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return { time: DEFAULT_RELEASE_TIME };

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: WIB_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';
  const year = Number(part('year'));
  const month = Number(part('month'));
  const day = Number(part('day'));

  return {
    date: new Date(year, month - 1, day, 12),
    time: `${part('hour')}:${part('minute')}`
  };
}

function toWibIso(date: Date, time: string) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return new Date(`${year}-${month}-${day}T${time}:00+07:00`).toISOString();
}

function getWibToday() {
  return getWibParts(new Date()).date ?? new Date();
}

function formatReleaseDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: WIB_TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(new Date(value));
}

export function ReleaseScheduleField({
  value,
  onChange,
  stockMode = 'QUANTITY',
  onStockModeChange
}: ReleaseScheduleFieldProps) {
  const [initialValue] = React.useState<ScheduleParts | null>(() =>
    value ? getWibParts(value) : null
  );
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(initialValue?.date);
  const [selectedTime, setSelectedTime] = React.useState(
    initialValue?.time ?? DEFAULT_RELEASE_TIME
  );

  const updateDate = (date: Date | undefined) => {
    setSelectedDate(date);
    onChange(date ? toWibIso(date, selectedTime) : null);
  };

  const updateTime = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) onChange(toWibIso(selectedDate, time));
  };

  const applyPreset = (daysFromToday: number, time: string) => {
    const date = addDays(getWibToday(), daysFromToday);
    setSelectedDate(date);
    setSelectedTime(time);
    onChange(toWibIso(date, time));
  };

  const resetSchedule = () => {
    setSelectedDate(undefined);
    setSelectedTime(DEFAULT_RELEASE_TIME);
    onChange(null);
  };

  return (
    <section className="relative rounded-2xl border border-primary/20 bg-muted/10 p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3.5">
        <div className="space-y-0.5">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
            <Timer className="h-4 w-4 text-primary" />
            <span>Pengaturan Jadwal & Mode Rilis Drop</span>
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Countdown publik akan otomatis aktif di halaman katalog produk sesuai waktu Indonesia Barat (WIB).
          </p>
        </div>
        <Badge variant="outline" className="w-fit text-[10px] font-bold border-primary/30 text-primary uppercase">
          Coming Soon
        </Badge>
      </div>

      {/* Date & Time Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="release-date" className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Tanggal Peluncuran</span>
            <span className="text-red-500">*</span>
          </Label>
          <DatePicker
            id="release-date"
            ariaLabel="Pilih tanggal peluncuran"
            value={selectedDate}
            onChange={updateDate}
            format="dd MMM yyyy"
            placeholder="Pilih tanggal rilis"
            minDate={getWibToday()}
            isClearable={false}
            className="[&>button]:h-10 [&>button]:rounded-xl [&>button]:bg-background"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="release-time" className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Jam Rilis (WIB)</span>
            <span className="text-red-500">*</span>
          </Label>
          <TimePicker
            id="release-time"
            ariaLabel="Pilih jam rilis dalam WIB"
            value={selectedTime}
            onChange={updateTime}
            minuteStep={5}
            timezoneLabel="WIB"
            align="right"
            className="[&>button]:h-10 [&>button]:rounded-xl [&>button]:bg-background"
          />
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/20">
        <span className="text-[11px] font-bold text-muted-foreground mr-1">Preset Cepat:</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => applyPreset(1, '19:00')}
          className="h-7 rounded-lg bg-background px-2.5 text-[11px] font-medium cursor-pointer"
        >
          Besok, 19:00
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => applyPreset(3, '19:00')}
          className="h-7 rounded-lg bg-background px-2.5 text-[11px] font-medium cursor-pointer"
        >
          +3 Hari, 19:00
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => applyPreset(7, '20:00')}
          className="h-7 rounded-lg bg-background px-2.5 text-[11px] font-medium cursor-pointer"
        >
          +7 Hari, 20:00
        </Button>
        {value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetSchedule}
            className="ml-auto h-7 gap-1 rounded-lg border-destructive/30 px-2.5 text-[11px] text-destructive hover:bg-destructive/10 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      {/* Mode Setelah Rilis (if callback provided) */}
      {onStockModeChange && (
        <div className="space-y-1.5 pt-2 border-t border-border/20">
          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Mode Stok Setelah Rilis Selesai</span>
          </Label>
          <Select value={stockMode} onValueChange={(val) => onStockModeChange(val as StockMode)}>
            <SelectTrigger className="h-10 rounded-xl bg-background text-xs font-bold">
              <SelectValue placeholder="Pilih mode stok setelah rilis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="QUANTITY">Limited / Stok Terbatas (Sesuai Manajemen Stok)</SelectItem>
              <SelectItem value="ALWAYS_AVAILABLE">Selalu Tersedia (Unlimited / Continuous)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {stockMode === 'QUANTITY'
              ? 'Ketika waktu countdown habis, produk otomatis berstatus Available dan stok per ukuran diambil dari Manajemen Stok.'
              : 'Ketika waktu countdown habis, produk otomatis berstatus Available dengan stok tak terbatas.'}
          </p>
        </div>
      )}

      {/* Live Scheduled Status & Countdown Preview */}
      {value && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/90 p-3.5 shadow-2xs">
          <div className="space-y-0.5 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Jadwal Rilis Terpilih
            </p>
            <p className="text-xs font-bold text-foreground capitalize">
              {formatReleaseDate(value)} WIB
            </p>
          </div>
          <CountdownTimer
            targetDate={value}
            variant="compact"
            className="shrink-0 rounded-lg border-border/60 bg-card text-foreground"
          />
        </div>
      )}
    </section>
  );
}
