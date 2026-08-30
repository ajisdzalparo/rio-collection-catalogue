'use client';

import * as React from 'react';
import { Search, ChevronDown, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchableSelectOption {
  label: string;
  value: string;
}

export interface SearchableSelectProps {
  value: string;
  onValueChange: (val: string) => void;
  options: Array<SearchableSelectOption | string>;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  variant?: 'catalogue' | 'dashboard';
  className?: string;
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Pilih opsi...',
  searchPlaceholder = 'Cari...',
  disabled = false,
  isLoading = false,
  variant = 'catalogue',
  className
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const normalizedOptions: SearchableSelectOption[] = React.useMemo(() => {
    return options.map((opt) => (typeof opt === 'string' ? { label: opt, value: opt } : opt));
  }, [options]);

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const query = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter((opt) => opt.label.toLowerCase().includes(query));
  }, [normalizedOptions, searchQuery]);

  const selectedOption = React.useMemo(() => {
    return normalizedOptions.find((opt) => opt.value === value);
  }, [normalizedOptions, value]);

  // Handle click outside to close popover
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when popover opens
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      queueMicrotask(() => {
        setSearchQuery('');
      });
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onValueChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          variant === 'dashboard'
            ? 'w-full flex items-center justify-between gap-2 h-10 rounded-xl bg-background border border-input px-3.5 py-2 font-sans text-xs font-semibold text-foreground outline-none transition-all shadow-2xs hover:bg-muted/20 focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed'
            : 'w-full flex items-center justify-between gap-2 bg-transparent border-0 border-b border-(--cat-stone) py-2 px-0 font-hanken text-[14px] text-(--cat-on-surface) outline-none transition-colors text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
          isOpen && (variant === 'dashboard' ? 'border-primary ring-2 ring-primary/20' : 'border-(--cat-charcoal)')
        )}
      >
        <span className={cn('truncate', !selectedOption && 'text-(--cat-outline-variant)')}>
          {isLoading ? (
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <Loader2 size={14} className="animate-spin" />
              <span>Memuat data...</span>
            </span>
          ) : (
            selectedOption?.label || placeholder
          )}
        </span>
        <ChevronDown size={16} className={cn('opacity-60 shrink-0 transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      {/* Popover Dropdown with Live Search */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full max-h-72 bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Search Input Field */}
          <div className="p-2 border-b border-stone-200 dark:border-zinc-800 flex items-center gap-2 bg-stone-50 dark:bg-zinc-900/50">
            <Search size={14} className="opacity-50 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent font-hanken text-xs text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-400"
            />
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-56 p-1 space-y-0.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg font-hanken text-xs text-left transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-medium'
                        : 'hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check size={14} className="shrink-0 ml-2 opacity-80" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center font-hanken text-xs text-zinc-400">
                Tidak ada data yang cocok dengan &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
