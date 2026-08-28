'use client';

import * as React from 'react';
import { Search, Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
  colorDot?: string;
  icon?: React.ElementType;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  maxCount?: number;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = 'Select options...',
  searchPlaceholder = 'Search options...',
  emptyText = 'No options found.',
  maxCount = 1,
  className,
  disabled = false
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOptions = React.useMemo(() => {
    return options.filter((opt) => value.includes(opt.value));
  }, [options, value]);

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options;
    const query = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        (opt.description && opt.description.toLowerCase().includes(query))
    );
  }, [options, search]);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleSelectAll = () => {
    if (value.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((opt) => opt.value));
    }
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-2xl border border-border/60 bg-card px-3.5 text-xs font-semibold text-foreground shadow-2xs transition-all hover:bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
          isOpen && 'border-primary ring-1 ring-primary/40'
        )}
      >
        <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
          {selectedOptions.length === 0 ? (
            <span className="text-muted-foreground/70">{placeholder}</span>
          ) : (
            <>
              {selectedOptions.slice(0, maxCount).map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border/50 px-2.5 py-0.5 text-[11px] font-medium text-foreground shrink-0 max-w-40 truncate"
                >
                  {option.colorDot && (
                    <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', option.colorDot)} />
                  )}
                  <span className="truncate">{option.label}</span>
                </span>
              ))}

              {selectedOptions.length > maxCount && (
                <span className="inline-flex items-center rounded-full bg-muted border border-border/50 px-2 py-0.5 text-[10px] font-bold text-muted-foreground shrink-0">
                  +{selectedOptions.length - maxCount} more
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedOptions.length > 0 && (
            <X
              className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              onClick={handleClearAll}
            />
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full rounded-2xl border border-border/60 bg-popover/98 p-2 shadow-xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8.5 w-full rounded-xl border border-border/40 bg-muted/40 pl-8 pr-7 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between border-b border-border/40 pb-2 px-2 mb-1.5 text-[11px] text-muted-foreground font-medium">
            <span>
              <strong className="text-foreground">{selectedOptions.length}</strong> of{' '}
              {options.length} selected
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-foreground hover:text-primary font-bold text-[11px] cursor-pointer transition-colors"
            >
              {value.length === options.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs font-medium text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                const Icon = option.icon;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleOption(option.value)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-semibold transition-all cursor-pointer select-none',
                      isSelected
                        ? 'bg-muted/80 text-foreground'
                        : 'text-foreground hover:bg-muted/40'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          'h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                          isSelected
                            ? 'bg-foreground border-foreground text-background'
                            : 'border-border/80 bg-card'
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[2.5]" />}
                      </div>

                      {option.colorDot && (
                        <span className={cn('h-2 w-2 rounded-full shrink-0', option.colorDot)} />
                      )}

                      {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}

                      <div className="truncate">
                        <div className="truncate">{option.label}</div>
                        {option.description && (
                          <div className="text-[10px] font-normal text-muted-foreground truncate mt-0.5">
                            {option.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
