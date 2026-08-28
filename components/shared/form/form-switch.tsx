'use client';

import React from 'react';
import { Switch, type SwitchProps } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export interface FormSwitchProps extends SwitchProps {
  label: string;
  description?: string;
  error?: string;
  containerClassName?: string;
}

export function FormSwitch({
  label,
  description,
  error,
  containerClassName,
  id,
  className,
  ...props
}: FormSwitchProps) {
  const generatedId = React.useId();
  const switchId = id || generatedId;

  return (
    <div className={cn('flex items-start justify-between gap-4 space-y-0.5', containerClassName)}>
      <div className="space-y-0.5 min-w-0 pr-2">
        <label
          htmlFor={switchId}
          className="text-xs font-bold text-foreground cursor-pointer select-none block leading-snug"
        >
          {label}
        </label>
        {description && (
          <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
        {error && <p className="text-[11px] font-semibold text-destructive">{error}</p>}
      </div>

      <Switch id={switchId} className={className} {...props} />
    </div>
  );
}
