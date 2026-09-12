'use client';

import * as React from 'react';
import { Check, ChevronDown, Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type MinuteStep = 1 | 5 | 10 | 15 | 30;

interface TimePickerProps {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  minuteStep?: MinuteStep;
  disabled?: boolean;
  className?: string;
  align?: 'left' | 'right';
  ariaLabel?: string;
  timezoneLabel?: string;
}

function padTimePart(value: number) {
  return String(value).padStart(2, '0');
}

function parseTime(value?: string) {
  const match = value?.match(/^(\d{2}):(\d{2})$/);
  if (!match) return { hour: 19, minute: 0 };

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return { hour: 19, minute: 0 };

  return { hour, minute };
}

export function TimePicker({
  id,
  value,
  onChange,
  minuteStep = 5,
  disabled = false,
  className,
  align = 'left',
  ariaLabel = 'Pilih waktu',
  timezoneLabel
}: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const selected = parseTime(value);

  const minuteOptions = React.useMemo(() => {
    const options = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, index) => index * minuteStep);
    return options.includes(selected.minute)
      ? options
      : [...options, selected.minute].sort((left, right) => left - right);
  }, [minuteStep, selected.minute]);

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const selectTimePart = (hour: number, minute: number) => {
    onChange(`${padTimePart(hour)}:${padTimePart(minute)}`);
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        id={id}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        className={cn(
          'flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/30 px-3.5 text-xs font-semibold text-foreground shadow-2xs transition-all hover:bg-muted/60 focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50',
          isOpen && 'border-primary ring-1 ring-primary/40'
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Clock3 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="font-mono text-[13px] tracking-wide">{value || 'Pilih waktu'}</span>
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label={ariaLabel}
          className={cn(
            'absolute z-60 mt-2 w-[min(21rem,calc(100vw-2rem))] rounded-2xl border border-border/80 bg-card p-3 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.45)] backdrop-blur-md animate-in fade-in-50 zoom-in-95',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div>
              <p className="text-sm font-bold text-foreground">Pilih jam rilis</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Klik jam dan menit</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="rounded-lg bg-muted px-2 py-1 font-mono text-sm font-bold tabular-nums text-foreground">
                {padTimePart(selected.hour)}:{padTimePart(selected.minute)}
              </span>
              {timezoneLabel && (
                <span className="rounded-md bg-primary/10 px-1.5 py-1 text-[9px] font-bold text-primary">
                  {timezoneLabel}
                </span>
              )}
            </div>
          </div>

          <div role="group" aria-label="Pilih jam" className="rounded-xl bg-muted/40 p-2">
            <p className="mb-1.5 px-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Jam
            </p>
            <div className="grid grid-cols-6 gap-1">
              {Array.from({ length: 24 }, (_, hour) => (
                <button
                  key={hour}
                  type="button"
                  aria-label={`Jam ${padTimePart(hour)}`}
                  aria-pressed={selected.hour === hour}
                  onClick={() => selectTimePart(hour, selected.minute)}
                  className={cn(
                    'h-8 rounded-lg text-xs font-semibold tabular-nums transition-all hover:bg-background hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected.hour === hour &&
                      'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                  )}
                >
                  {padTimePart(hour)}
                </button>
              ))}
            </div>
          </div>

          <div role="group" aria-label="Pilih menit" className="mt-2 rounded-xl bg-muted/40 p-2">
            <p className="mb-1.5 px-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Menit
            </p>
            <div className="grid grid-cols-6 gap-1">
              {minuteOptions.map((minute) => (
                <button
                  key={minute}
                  type="button"
                  aria-label={`Menit ${padTimePart(minute)}`}
                  aria-pressed={selected.minute === minute}
                  onClick={() => selectTimePart(selected.hour, minute)}
                  className={cn(
                    'h-8 rounded-lg text-xs font-semibold tabular-nums transition-all hover:bg-background hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected.minute === minute &&
                      'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                  )}
                >
                  {padTimePart(minute)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              Format 24 jam
            </span>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-9 gap-1.5 rounded-lg px-3.5 text-xs"
            >
              <Check className="h-3.5 w-3.5" />
              Selesai
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
