import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface RupiahInputProps extends Omit<
  React.ComponentProps<'input'>,
  'value' | 'onChange'
> {
  value: number;
  onValueChange: (value: number) => void;
  prefix?: string;
}

function formatNumberToRupiah(val: number | string): string {
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  return isNaN(num) ? '' : num.toLocaleString('id-ID');
}

export const RupiahInput = React.forwardRef<HTMLInputElement, RupiahInputProps>(
  (
    { value, onValueChange, className, prefix = 'Rp', disabled, placeholder = '0', ...props },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState(() =>
      value > 0 ? formatNumberToRupiah(value) : ''
    );

    React.useEffect(() => {
      setDisplayValue(value > 0 ? formatNumberToRupiah(value) : '');
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawInput = e.target.value;
      const digitsOnly = rawInput.replace(/\D/g, '');
      const numericVal = digitsOnly ? parseInt(digitsOnly, 10) : 0;

      setDisplayValue(digitsOnly ? formatNumberToRupiah(numericVal) : '');
      onValueChange(numericVal);
    };

    return (
      <div className="relative flex items-center w-full">
        <span className="absolute left-3.5 text-xs font-extrabold text-muted-foreground select-none pointer-events-none z-10">
          {prefix}
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className={cn('pl-10 font-bold', className)}
          {...props}
        />
      </div>
    );
  }
);

RupiahInput.displayName = 'RupiahInput';
