import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface SelectOption {
  label: string;
  value: string;
}

export interface FormSelectProps {
  id?: string;
  label?: string;
  error?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
}

export function FormSelect({
  id,
  label,
  error,
  value,
  defaultValue,
  onValueChange,
  placeholder = 'Select option...',
  options,
  disabled = false,
  className
}: FormSelectProps) {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label htmlFor={id} className="text-xs font-bold text-foreground">{label}</label>}
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={(val) => {
          if (val !== null) {
            onValueChange?.(val);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger id={id} className={cn(error && 'border-destructive', className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-[11px] font-semibold text-destructive">{error}</p>}
    </div>
  );
}
