export interface DateRange {
  from?: Date;
  to?: Date;
}

export type DatePickerMode = 'single' | 'range';

export interface DatePickerPreset {
  label: string;
  getValue: () => DateRange;
}

export interface DatePickerProps {
  id?: string;
  ariaLabel?: string;
  mode?: DatePickerMode;
  value?: Date;
  rangeValue?: DateRange;
  onChange?: (date: Date | undefined) => void;
  onRangeChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  format?: string;
  minDate?: Date;
  maxDate?: Date;
  isDateDisabled?: (date: Date) => boolean;
  showPresets?: boolean;
  presets?: DatePickerPreset[];
  isClearable?: boolean;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'right';
}
