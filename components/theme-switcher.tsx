'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeTransition } from '@/hooks/use-theme-transition';
import { cn } from '@/lib/utils';

const emptySubscribe = () => () => {};

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, changeTheme } = useThemeTransition();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return <div className="h-8 w-24 rounded-full bg-muted/50 animate-pulse" />;
  }

  const options = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 text-xs shadow-sm',
        className
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => changeTheme(option.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition-all duration-200 ease-out active:scale-95 select-none',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                isActive && 'scale-110'
              )}
            />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
