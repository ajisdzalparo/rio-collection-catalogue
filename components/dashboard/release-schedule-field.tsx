'use client';

import * as React from 'react';
import { addDays } from 'date-fns';
import { CalendarDays, Clock3, RotateCcw } from 'lucide-react';
import { CountdownTimer } from '@/components/catalogue/countdown-timer';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { TimePicker } from '@/components/ui/time-picker';

const WIB_TIME_ZONE = 'Asia/Jakarta';
const DEFAULT_RELEASE_TIME = '19:00';

interface ReleaseScheduleFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
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

export function ReleaseScheduleField({ value, onChange }: ReleaseScheduleFieldProps) {
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
    <section className="relative rounded-2xl border border-primary/15 bg-linear-to-br from-primary/6 via-card to-card p-4 shadow-xs sm:p-5">
      <div className="mb-4 border-b border-border/50 pb-4">
        <div>
          <h4 className="text-sm font-extrabold tracking-tight text-foreground">Jadwal Rilis Drop</h4>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            Countdown publik aktif otomatis sesuai waktu Indonesia Barat.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="release-date" className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            Tanggal Peluncuran
          </Label>
          <DatePicker
            id="release-date"
            ariaLabel="Pilih tanggal peluncuran"
            value={selectedDate}
            onChange={updateDate}
            format="dd/MM/yyyy"
            placeholder="Pilih tanggal"
            minDate={getWibToday()}
            isClearable={false}
            className="[&>button]:h-11 [&>button]:rounded-xl [&>button]:bg-background/80"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="release-time" className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
            Jam Rilis (WIB)
          </Label>
          <TimePicker
            id="release-time"
            ariaLabel="Pilih jam rilis dalam WIB"
            value={selectedTime}
            onChange={updateTime}
            minuteStep={5}
            timezoneLabel="WIB"
            align="right"
            className="[&>button]:h-11 [&>button]:rounded-xl [&>button]:bg-background/80"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[11px] font-medium text-muted-foreground">Preset cepat</span>
        <Button type="button" variant="outline" size="sm" onClick={() => applyPreset(1, '19:00')} className="h-8 rounded-lg bg-background/60 px-3 text-[11px]">
          Besok, 19:00
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => applyPreset(3, '19:00')} className="h-8 rounded-lg bg-background/60 px-3 text-[11px]">
          +3 hari
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => applyPreset(7, '20:00')} className="h-8 rounded-lg bg-background/60 px-3 text-[11px]">
          +7 hari, 20:00
        </Button>
        {value && (
          <Button type="button" variant="outline" size="sm" onClick={resetSchedule} className="ml-auto h-8 gap-1.5 rounded-lg border-destructive/30 px-3 text-[11px] text-destructive hover:bg-destructive/10 hover:text-destructive">
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      {value && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border/60 bg-background/75 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rilis dijadwalkan</p>
            <p className="mt-0.5 text-xs font-bold capitalize text-foreground">{formatReleaseDate(value)} WIB</p>
          </div>
          <CountdownTimer targetDate={value} variant="compact" className="shrink-0 rounded-lg border-border bg-card text-foreground" />
        </div>
      )}
    </section>
  );
}
