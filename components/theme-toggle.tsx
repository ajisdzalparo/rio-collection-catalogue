'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeTransition } from '@/hooks/use-theme-transition';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { changeTheme } = useThemeTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="relative h-9 w-9 rounded-lg transition-transform duration-200 active:scale-95"
          />
        }
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300 ease-out dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-300 ease-out dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem
          onClick={() => changeTheme('light')}
          className="cursor-pointer gap-2 transition-colors hover:bg-accent"
        >
          <Sun className="h-4 w-4 transition-transform group-hover:rotate-45" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeTheme('dark')}
          className="cursor-pointer gap-2 transition-colors hover:bg-accent"
        >
          <Moon className="h-4 w-4 transition-transform group-hover:-rotate-12" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeTheme('system')}
          className="cursor-pointer gap-2 transition-colors hover:bg-accent"
        >
          <Monitor className="h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
