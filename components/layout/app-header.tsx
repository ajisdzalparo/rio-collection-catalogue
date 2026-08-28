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
import { User, LogOut, Settings, Search, Bell, Plus, Command } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AppHeader() {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border/40 pb-4 bg-transparent transition-all">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1 rounded-xl hover:bg-muted/80" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <AppBreadcrumb />
      </div>

      <div className="flex items-center gap-3">
        {/* Equa Command Search Bar */}
        <div className="relative hidden md:flex items-center w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search or type a command"
            className="pl-9 pr-12 h-9 rounded-full bg-card border-border/70 text-xs focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-mono text-muted-foreground border border-border/60">
            <Command className="h-2.5 w-2.5" />
            <span>F</span>
          </div>
        </div>

        {/* Primary Action Button: + New Project */}
        <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-bold px-4 h-9 text-xs gap-1.5 shadow-xs">
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Button>

        {/* Bell Notifications Button */}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full relative bg-card border-border/70"
        >
          <Bell className="h-4 w-4 text-foreground" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
        </Button>

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
                <p className="text-sm font-semibold leading-none">Ajis Johnson</p>
                <p className="text-xs leading-none text-muted-foreground">Ajis@equa.design</p>
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
