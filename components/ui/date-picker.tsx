'use client';

import * as React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, RotateCcw } from 'lucide-react';
import {
  format as formatDateFns,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  isBefore,
  isAfter,
  subDays,
  startOfYear,
  endOfYear,
  getYear,
  setYear,
  setMonth
} from 'date-fns';
import { cn } from '@/lib/utils';
import { DatePickerProps, DatePickerPreset } from '@/types/date-picker.types';

const DEFAULT_PRESETS: DatePickerPreset[] = [
  {
    label: 'Today',
    getValue: () => {
      const today = new Date();
      return { from: today, to: today };
    }
  },
  {
    label: 'Yesterday',
    getValue: () => {
      const yesterday = subDays(new Date(), 1);
      return { from: yesterday, to: yesterday };
    }
  },
  {
    label: 'Last 7 Days',
    getValue: () => {
      const today = new Date();
      return { from: subDays(today, 6), to: today };
    }
  },
  {
    label: 'Last 30 Days',
    getValue: () => {
      const today = new Date();
      return { from: subDays(today, 29), to: today };
    }
  },
  {
    label: 'This Month',
    getValue: () => {
      const today = new Date();
      return { from: startOfMonth(today), to: endOfMonth(today) };
    }
  },
  {
    label: 'Last Month',
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }
  },
  {
    label: 'This Year',
    getValue: () => {
      const today = new Date();
      return { from: startOfYear(today), to: endOfYear(today) };
    }
  }
];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export function DatePicker({
  id,
  ariaLabel,
  mode = 'single',
  value,
  rangeValue,
  onChange,
  onRangeChange,
  placeholder,
  format = 'MMM dd, yyyy',
  minDate,
  maxDate,
  isDateDisabled,
  showPresets,
  presets = DEFAULT_PRESETS,
  isClearable = true,
  disabled = false,
  className,
  size = 'md',
  align = 'left'
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => {
    if (mode === 'single' && value) return value;
    if (mode === 'range' && rangeValue?.from) return rangeValue.from;
    return new Date();
  });

  const targetPropDate = mode === 'single' ? value : rangeValue?.from;
  const [prevTargetPropDate, setPrevTargetPropDate] = React.useState<Date | undefined>(
    targetPropDate
  );

  if (targetPropDate !== prevTargetPropDate) {
    setPrevTargetPropDate(targetPropDate);
    if (targetPropDate) {
      setCurrentMonth(targetPropDate);
    }
  }

  const [hoverDate, setHoverDate] = React.useState<Date | undefined>(undefined);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [mobileStyle, setMobileStyle] = React.useState<React.CSSProperties>({});

  React.useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const updatePosition = () => {
      if (!containerRef.current) return;
      const vw = window.innerWidth;
      // For narrow viewports, use fixed positioning centered on screen
      if (vw < 640) {
        const rect = containerRef.current.getBoundingClientRect();
        const popupWidth = Math.min(360, vw - 24);
        setMobileStyle({
          position: 'fixed',
          top: `${rect.bottom + 8}px`,
          left: `${(vw - popupWidth) / 2}px`,
          right: 'auto',
          width: `${popupWidth}px`,
          zIndex: 9999
        });
      } else {
        setMobileStyle({});
      }
    };

    // Small delay to ensure DOM has rendered
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const defaultPlaceholder =
    placeholder || (mode === 'single' ? 'Select date...' : 'Select date range...');
  const shouldShowPresets = showPresets ?? mode === 'range';

  const handlePrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));

  const handleMonthSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const monthIndex = parseInt(e.target.value, 10);
    setCurrentMonth((prev) => setMonth(prev, monthIndex));
  };

  const handleYearSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(e.target.value, 10);
    setCurrentMonth((prev) => setYear(prev, year));
  };

  const currentYearNum = getYear(new Date());
  const yearOptions = React.useMemo(() => {
    const years: number[] = [];
    for (let y = currentYearNum - 50; y <= currentYearNum + 15; y++) {
      years.push(y);
    }
    return years;
  }, [currentYearNum]);

  const daysGrid = React.useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const checkIsDisabled = (day: Date) => {
    if (minDate && isBefore(day, minDate) && !isSameDay(day, minDate)) return true;
    if (maxDate && isAfter(day, maxDate) && !isSameDay(day, maxDate)) return true;
    if (isDateDisabled && isDateDisabled(day)) return true;
    return false;
  };

  const handleDayClick = (day: Date) => {
    if (checkIsDisabled(day)) return;

    if (mode === 'single') {
      onChange?.(day);
      setIsOpen(false);
    } else {
      if (!rangeValue?.from || (rangeValue.from && rangeValue.to)) {
        onRangeChange?.({ from: day, to: undefined });
      } else if (rangeValue.from && !rangeValue.to) {
        if (isBefore(day, rangeValue.from)) {
          onRangeChange?.({ from: day, to: undefined });
        } else {
          onRangeChange?.({ from: rangeValue.from, to: day });
          setIsOpen(false);
        }
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === 'single') {
      onChange?.(undefined);
    } else {
      onRangeChange?.(undefined);
    }
  };

  const getDisplayText = () => {
    if (mode === 'single') {
      if (value) return formatDateFns(value, format);
    } else {
      if (rangeValue?.from && rangeValue?.to) {
        return `${formatDateFns(rangeValue.from, format)} - ${formatDateFns(rangeValue.to, format)}`;
      }
      if (rangeValue?.from) {
        return `${formatDateFns(rangeValue.from, format)} - ...`;
      }
    }
    return defaultPlaceholder;
  };

  const hasValue = mode === 'single' ? Boolean(value) : Boolean(rangeValue?.from || rangeValue?.to);

  const sizeClasses = {
    sm: 'h-8 px-2.5 text-[11px] rounded-md',
    md: 'h-10 px-3.5 text-xs rounded-lg',
    lg: 'h-11 px-4 text-sm rounded-lg'
  };

  return (
    <div ref={containerRef} className={cn('relative w-full inline-block', className)}>
      <button
        id={id}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex w-full items-center justify-between gap-2 border border-border/60 bg-muted/30 font-semibold text-foreground shadow-2xs transition-all hover:bg-muted/60 focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer select-none',
          sizeClasses[size],
          isOpen && 'border-primary ring-1 ring-primary/40'
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className={cn('truncate', !hasValue && 'text-muted-foreground font-normal')}>
            {getDisplayText()}
          </span>
        </div>

        {hasValue && isClearable && !disabled ? (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0"
            title="Clear date"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </button>

      {isOpen && (
        <div
          style={mobileStyle}
          className={cn(
            'z-50 flex flex-col sm:flex-row rounded-xl border border-border/70 bg-card p-3.5 sm:p-4 shadow-xl backdrop-blur-md animate-in fade-in-50 zoom-in-95',
            mobileStyle.position === 'fixed'
              ? '' // fixed positioning handled by inline style
              : cn('absolute mt-2', align === 'right' ? 'right-0 left-auto' : 'left-0 right-auto'),
            shouldShowPresets ? 'sm:w-auto sm:min-w-120' : 'sm:w-[320px]'
          )}
        >
          {shouldShowPresets && (
            <div className="flex flex-wrap sm:flex-col gap-1 pb-3 sm:pb-0 sm:pr-4 border-b sm:border-b-0 sm:border-r border-border/60 shrink-0">
              <span className="hidden sm:block text-[11px] font-bold text-muted-foreground px-2.5 py-1 uppercase tracking-wider">
                Shortcuts
              </span>
              {presets.map((preset, idx) => {
                const val = preset.getValue();
                const isSelected =
                  mode === 'single'
                    ? Boolean(value && val.from && isSameDay(value, val.from))
                    : Boolean(
                        rangeValue?.from &&
                          rangeValue?.to &&
                          isSameDay(rangeValue.from, val.from!) &&
                          isSameDay(rangeValue.to, val.to!)
                      );

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (mode === 'single') {
                        onChange?.(val.from);
                      } else {
                        onRangeChange?.(val);
                      }
                      if (val.from) setCurrentMonth(val.from);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'px-2.5 py-1.5 rounded-md text-xs font-semibold text-left transition-all cursor-pointer',
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex-1 space-y-4 pt-3 sm:pt-0 sm:pl-2">
            <div className="flex items-center justify-between gap-1 px-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1">
                <select
                  value={getYear(currentMonth) >= 0 ? currentMonth.getMonth() : 0}
                  onChange={handleMonthSelect}
                  className="h-7 text-xs font-bold bg-transparent border-0 text-foreground cursor-pointer focus:outline-none hover:bg-muted/50 rounded-lg px-1"
                >
                  {MONTH_NAMES.map((month, idx) => (
                    <option key={month} value={idx} className="bg-card text-foreground">
                      {month}
                    </option>
                  ))}
                </select>

                <select
                  value={getYear(currentMonth)}
                  onChange={handleYearSelect}
                  className="h-7 text-xs font-bold bg-transparent border-0 text-foreground cursor-pointer focus:outline-none hover:bg-muted/50 rounded-lg px-1"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y} className="bg-card text-foreground">
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 text-center">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div key={day} className="text-[11px] font-bold text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {daysGrid.map((day, idx) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isDisabled = checkIsDisabled(day);

                const isSingleSelected = mode === 'single' && value && isSameDay(day, value);
                const isRangeStart =
                  mode === 'range' && rangeValue?.from && isSameDay(day, rangeValue.from);
                const isRangeEnd =
                  mode === 'range' && rangeValue?.to && isSameDay(day, rangeValue.to);

                const isRangeSelected = isRangeStart || isRangeEnd;

                const isInSelectedRange =
                  mode === 'range' &&
                  rangeValue?.from &&
                  rangeValue?.to &&
                  isWithinInterval(day, { start: rangeValue.from, end: rangeValue.to });

                const isInHoverRange =
                  mode === 'range' &&
                  rangeValue?.from &&
                  !rangeValue?.to &&
                  hoverDate &&
                  isAfter(hoverDate, rangeValue.from) &&
                  isWithinInterval(day, { start: rangeValue.from, end: hoverDate });

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleDayClick(day)}
                    onMouseEnter={() => setHoverDate(day)}
                    onMouseLeave={() => setHoverDate(undefined)}
                    className={cn(
                      'h-8 w-full rounded-md text-xs font-semibold transition-all relative cursor-pointer select-none flex items-center justify-center',
                      !isCurrentMonth && 'text-muted-foreground/30',
                      isCurrentMonth && !isDisabled && 'text-foreground hover:bg-muted/70',
                      isDisabled && 'opacity-20 cursor-not-allowed hover:bg-transparent',
                      isSingleSelected &&
                        'bg-primary text-primary-foreground font-bold shadow-xs hover:bg-primary/90',
                      isRangeSelected &&
                        'bg-primary text-primary-foreground font-bold shadow-xs z-10 hover:bg-primary/90',
                      isInSelectedRange &&
                        !isRangeSelected &&
                        'bg-primary/15 text-primary font-bold rounded-none hover:bg-primary/25',
                      isInHoverRange &&
                        !isRangeStart &&
                        'bg-primary/10 text-foreground rounded-none border-y border-dashed border-primary/40'
                    )}
                  >
                    {formatDateFns(day, 'd')}
                  </button>
                );
              })}
            </div>

            {hasValue && (
              <div className="pt-2 border-t border-border/50 flex justify-end">
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset selection
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
