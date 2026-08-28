'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import AppBreadcrumb from './app-breadcrumb';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { User, LogOut, Settings } from 'lucide-react';

export default function AppHeader() {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border/40 pb-4 bg-transparent transition-all">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1 rounded-xl hover:bg-muted/80" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <AppBreadcrumb />
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        {/* User Profile Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-full overflow-hidden border border-border/80"
              >
                <div className="h-full w-full bg-linear-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs">
                  A
                </div>
                <span className="sr-only">User menu</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-lg">
            <DropdownMenuLabel className="font-normal p-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">Admin RIO</p>
                <p className="text-xs leading-none text-muted-foreground">admin@riocollection.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2 rounded-xl">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2 rounded-xl">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2 rounded-xl text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
