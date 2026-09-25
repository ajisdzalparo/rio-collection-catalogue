'use client';

import { useState } from 'react';
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
import { User, LogOut, Settings, KeyRound } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { ChangePasswordDialog } from '@/components/auth/change-password-dialog';
import { OrderNotifications } from '@/components/dashboard/order-notifications';

export default function AppHeader() {
  const { user, logout, isLoggingOut } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'A';

  return (
    <>
      <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border/40 bg-transparent pb-3 transition-all sm:h-12 sm:gap-4 sm:pb-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <SidebarTrigger className="-ml-1 rounded-xl hover:bg-muted/80" />
          <Separator orientation="vertical" className="mr-2 hidden h-4 md:block" />
          <div className="min-w-0 overflow-hidden">
            <AppBreadcrumb />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <ThemeToggle />
          <OrderNotifications />

          {/* User Profile Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9 rounded-full overflow-hidden border border-border/80 cursor-pointer shadow-xs"
                >
                  <div className="h-full w-full bg-linear-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-extrabold text-xs">
                    {userInitial}
                  </div>
                  <span className="sr-only">User menu</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-lg">
              <DropdownMenuLabel className="font-normal p-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-extrabold leading-none text-foreground">{user?.name || 'Ajis'}</p>
                  <p className="text-xs leading-none text-muted-foreground truncate">{user?.email || 'ajis@riocollection.com'}</p>
                  <span className="mt-1 inline-flex w-fit items-center rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground border border-border/40">
                    {user?.role || 'Super Admin'}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/users" className="flex items-center gap-2 cursor-pointer" />}>
                <User className="h-4 w-4" />
                <span>Kelola Pengguna & Peran</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowChangePassword(true)} 
                className="flex items-center gap-2 cursor-pointer font-medium"
              >
                <KeyRound className="h-4 w-4 text-amber-500" />
                <span>Ganti Kata Sandi</span>
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/dashboard/settings" className="flex items-center gap-2 cursor-pointer" />}>
                <Settings className="h-4 w-4" />
                <span>Pengaturan Toko</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                disabled={isLoggingOut}
                onClick={() => logout()}
                className="cursor-pointer gap-2 rounded-xl text-destructive focus:text-destructive font-semibold"
              >
                <LogOut className="h-4 w-4" />
                <span>{isLoggingOut ? 'Sedang keluar...' : 'Keluar'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Admin / User Change Password Dialog */}
      <ChangePasswordDialog
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
        user={user}
      />
    </>
  );
}
