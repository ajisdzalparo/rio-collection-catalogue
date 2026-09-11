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

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          'w-full h-11 px-3.5 bg-(--cat-surface) border border-(--cat-stone) text-left font-hanken text-[13px] text-(--cat-on-surface) flex items-center justify-between gap-2 transition-colors cursor-pointer select-none',
          'hover:border-(--cat-charcoal)',
          'focus:outline-none focus:border-(--cat-charcoal)',
          isOpen && 'border-(--cat-charcoal)',
          (disabled || isLoading) &&
            'bg-(--cat-surface-container-low) opacity-60 cursor-not-allowed border-(--cat-stone)/60'
        )}
      >
        <span className={cn('truncate', !selectedOption && !value && 'text-(--cat-on-surface-variant)/60')}>
          {isLoading ? (
            <span className="flex items-center gap-2 text-(--cat-charcoal) font-medium">
              <Loader2 size={13} className="animate-spin" />
              <span>Memuat data...</span>
            </span>
          ) : (
            selectedOption?.label || value || placeholder
          )}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            'text-(--cat-on-surface) shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Popover Dropdown matching requested sharp minimalist design */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-full max-h-72 bg-(--cat-surface) border border-(--cat-charcoal)/30 shadow-xl z-50 overflow-hidden flex flex-col text-(--cat-on-surface) animate-in fade-in-0 duration-100">
          {/* Search Box with black border frame */}
          <div className="p-2.5 bg-(--cat-surface) border-b border-(--cat-stone)/40">
            <div className="flex items-center gap-2 px-2.5 h-9 border border-(--cat-charcoal)/80 bg-(--cat-surface)">
              <Search size={14} className="text-(--cat-on-surface-variant) opacity-70 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent font-hanken text-[13px] text-(--cat-on-surface) placeholder:text-(--cat-on-surface-variant)/50 outline-none"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-56 py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value || opt.label === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'w-full flex items-center justify-between px-3.5 py-2.5 font-hanken text-[13px] text-left transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-(--cat-charcoal) text-white font-medium'
                        : 'hover:bg-(--cat-surface-container-low) text-(--cat-on-surface)'
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check size={14} className="shrink-0 ml-2" />}
                  </button>
                );
              })
            ) : (
              <div className="py-6 px-4 text-center font-hanken text-[13px] text-(--cat-on-surface-variant)">
                Tidak ada data yang cocok dengan &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
