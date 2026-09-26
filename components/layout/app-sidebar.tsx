'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { navigation } from '@/config/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ChevronDown, PanelLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRbac } from '@/features/users/hooks/use-rbac';
import type { RolePermissions } from '@/features/users/types/roles.types';
import { useStoreSettingsQuery } from '@/hooks/use-store-settings';
import { useReferralAccess } from '@/features/referrals/hooks/use-referral-access';

const NAVIGATION_PERMISSION_MAP: Record<string, string> = {
  // Indonesian titles
  Ringkasan: 'overview.view',
  Pesanan: 'orders.view',
  'Manajemen Stok': 'stock.view',
  'Data Master': 'products.view',
  Blog: 'journal.view',
  Pelanggan: 'orders.view',
  Testimoni: 'testimonies.view',
  'Laporan Penjualan': 'reports.view',
  'Keuangan Super Admin': 'platform.finance.view',
  'Log Aktivitas': 'activity.view',
  'Pengaturan Toko': 'settings.view',
  'Manajemen Pengguna': 'users.view',
  Referral: 'referrals.view',

  // Fallbacks for English
  Overview: 'overview.view',
  Orders: 'orders.view',
  'Stock Management': 'stock.view',
  'Master Data': 'products.view',
  Customers: 'orders.view',
  Testimonials: 'testimonies.view',
  'Super Admin Finance': 'platform.finance.view',
  'Activity Log': 'activity.view',
  'Store Settings': 'settings.view',
  'User Management': 'users.view'
};

interface SidebarBrandMarkProps {
  logoUrl?: string | null;
  storeName: string;
}

function SidebarBrandMark({ logoUrl, storeName }: SidebarBrandMarkProps) {
  const [failedLogoUrl, setFailedLogoUrl] = React.useState<string | null>(null);
  const showLogo = Boolean(logoUrl && failedLogoUrl !== logoUrl);

  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-2xs ${
        showLogo ? 'border border-border/60' : 'bg-foreground text-background'
      }`}
    >
      {showLogo && logoUrl ? (
        <Image
          src={logoUrl}
          alt={`Logo ${storeName}`}
          width={36}
          height={36}
          unoptimized
          onError={() => setFailedLogoUrl(logoUrl)}
          className="h-full w-full object-cover"
          style={{ objectFit: 'cover' }}
        />
      ) : (
        <div className="grid h-4 w-4 grid-cols-2 gap-1" aria-hidden="true">
          <div className="h-1.5 w-1.5 rounded-full bg-background" />
          <div className="h-1.5 w-1.5 rounded-full bg-background" />
          <div className="h-1.5 w-1.5 rounded-full bg-background" />
          <div className="h-1.5 w-1.5 rounded-full bg-background opacity-40" />
        </div>
      )}
    </div>
  );
}

const ROUTE_ALIASES: Record<string, string> = {
  '/dashboard/master/categories': '/dashboard/master/kategori',
  '/dashboard/master/colors': '/dashboard/master/warna',
  '/dashboard/master/sizes': '/dashboard/master/ukuran',
  '/dashboard/master/materials': '/dashboard/master/bahan',
  '/dashboard/master/topics': '/dashboard/master/topik-blog',
  '/dashboard/master/banks': '/dashboard/master/bank',
  '/users/user': '/manajemen-pengguna/user',
  '/users/role': '/manajemen-pengguna/role',
  '/users': '/manajemen-pengguna/user'
};

function isItemHrefActive(
  href: string,
  pathname: string,
  searchParams: ReturnType<typeof useSearchParams>
): boolean {
  if (!href || href === '#') return false;

  const normalizedPath = ROUTE_ALIASES[pathname] || pathname;

  // Exact path match
  if (normalizedPath === href || pathname === href) {
    return true;
  }

  // Handle roles nested route matching under manajemen-pengguna/role
  if (
    href === '/manajemen-pengguna/role' &&
    (pathname.startsWith('/users/roles') || pathname.startsWith('/manajemen-pengguna/roles'))
  ) {
    return true;
  }

  // Nested route match (e.g. /dashboard/master/products/123 -> /dashboard/master/products)
  // Ensure we don't match root dashboard or master root to sub-items
  if (
    href !== '/dashboard' &&
    href !== '/dashboard/master' &&
    normalizedPath.startsWith(`${href}/`)
  ) {
    return true;
  }

  // Fallback for query parameters if any legacy link is clicked
  if (href.includes('?')) {
    const [hrefPath, hrefQuery] = href.split('?');
    if (pathname !== hrefPath && normalizedPath !== hrefPath) return false;

    const params = new URLSearchParams(hrefQuery);
    for (const [key, val] of params.entries()) {
      if (searchParams.get(key) !== val) return false;
    }
    return true;
  }

  return false;
}

function AppSidebarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { hasPermission, isLoading } = useRbac();
  const { data: referralAccess } = useReferralAccess();
  const { data: storeSettings } = useStoreSettingsQuery();
  const storeName = storeSettings?.storeName || 'RIO COLLECTION';

  const [openSubMenus, setOpenSubMenus] = React.useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    navigation.forEach((item) => {
      if (item.subMenu) {
        const isSubActive = item.subMenu.some((sub) =>
          isItemHrefActive(sub.href, pathname, searchParams)
        );
        if (isSubActive) {
          initialState[item.title] = true;
        }
      }
    });
    return initialState;
  });

  // Automatically expand active submenus when pathname or query parameters change
  React.useEffect(() => {
    navigation.forEach((item) => {
      if (item.subMenu) {
        const isSubActive = item.subMenu.some((sub) =>
          isItemHrefActive(sub.href, pathname, searchParams)
        );
        if (isSubActive) {
          setOpenSubMenus((prev) => ({
            ...prev,
            [item.title]: true
          }));
        }
      }
    });
  }, [pathname, searchParams]);

  const toggleSubMenu = (title: string) => {
    setOpenSubMenus((prev) => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  return (
    <Sidebar variant="floating" collapsible="icon" className="shrink-0">
      <SidebarHeader className="p-3.5 group-data-[collapsible=icon]:p-2 border-b border-border/30">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <SidebarBrandMark logoUrl={storeSettings?.logoUrl} storeName={storeName} />
          <div className="flex flex-col group-data-[collapsible=icon]:hidden min-w-0">
            <span className="font-extrabold tracking-tight text-sm text-foreground truncate">
              {storeName}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Katalog &amp; POS
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 group-data-[collapsible=icon]:px-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent className="mt-1">
            <SidebarMenu className="space-y-1">
              {isLoading ? (
                <div className="space-y-2 p-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-9 w-full rounded-xl bg-muted/40 animate-pulse" />
                  ))}
                </div>
              ) : (
                navigation.map((item) => {
                  if (
                    (item.href === '/dashboard/referrals' || item.title === 'Referral') &&
                    !referralAccess?.canView
                  ) {
                    return null;
                  }
                  const permKey = NAVIGATION_PERMISSION_MAP[item.title];
                  if (permKey && !hasPermission(permKey as keyof RolePermissions)) {
                    return null;
                  }

                  const Icon = item.icon;
                  const hasSubMenu = Boolean(item.subMenu && item.subMenu.length > 0);
                  const isSubActive =
                    hasSubMenu &&
                    item.subMenu?.some((sub) =>
                      isItemHrefActive(sub.href, pathname, searchParams)
                    );
                  const isActive =
                    !hasSubMenu && isItemHrefActive(item.href, pathname, searchParams);
                  const isItemActive = isActive || Boolean(isSubActive);
                  const isOpen = openSubMenus[item.title] ?? isSubActive;

                  if (hasSubMenu) {
                    // In collapsed mode, render a clean flyout dropdown menu on click/hover
                    if (isCollapsed) {
                      return (
                        <SidebarMenuItem key={item.title}>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <SidebarMenuButton
                                  isActive={isItemActive}
                                  tooltip={item.title}
                                  className={`h-10 rounded-2xl px-3.5 group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center transition-all duration-200 cursor-pointer ${
                                    isItemActive
                                      ? 'bg-primary! text-primary-foreground! font-bold shadow-xs hover:bg-primary/90! hover:text-primary-foreground!'
                                      : 'hover:bg-muted/80 text-muted-foreground hover:text-foreground font-medium'
                                  }`}
                                >
                                  {Icon && <Icon className="h-4 w-4 shrink-0" />}
                                </SidebarMenuButton>
                              }
                            />
                            <DropdownMenuContent
                              side="right"
                              align="start"
                              sideOffset={14}
                              className="w-52 rounded-2xl p-1.5 shadow-xl border border-border/60 bg-popover text-popover-foreground z-50 animate-in fade-in-50 zoom-in-95 duration-150"
                            >
                              <DropdownMenuLabel className="font-bold text-[11px] px-3 py-1.5 text-muted-foreground uppercase tracking-wider">
                                {item.title}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator className="my-1" />
                              {item.subMenu?.map((subItem) => {
                                const isSubItemActive = isItemHrefActive(
                                  subItem.href,
                                  pathname,
                                  searchParams
                                );
                                return (
                                  <DropdownMenuItem
                                    key={`${subItem.title}-${subItem.href}`}
                                    render={
                                      <Link
                                        href={subItem.href}
                                        className={`flex items-center justify-between w-full cursor-pointer rounded-xl px-2.5 py-2 text-xs transition-colors ${
                                          isSubItemActive
                                            ? 'bg-primary/10 text-primary font-bold'
                                            : 'text-foreground hover:bg-muted/70 font-medium'
                                        }`}
                                      />
                                    }
                                  >
                                    <span>{subItem.title}</span>
                                    {isSubItemActive && (
                                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                    )}
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </SidebarMenuItem>
                      );
                    }

                    // In expanded mode, render standard accordion
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          isActive={isItemActive}
                          tooltip={item.title}
                          onClick={() => toggleSubMenu(item.title)}
                          className={`h-10 rounded-2xl px-3.5 group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center transition-all duration-200 cursor-pointer ${
                            isItemActive
                              ? 'bg-primary! text-primary-foreground! font-bold shadow-xs hover:bg-primary/90! hover:text-primary-foreground!'
                              : 'hover:bg-muted/80 text-muted-foreground hover:text-foreground font-medium'
                          }`}
                        >
                          {Icon && <Icon className="h-4 w-4 shrink-0" />}
                          <span className="text-sm flex-1 text-left group-data-[collapsible=icon]:hidden">
                            {item.title}
                          </span>
                          <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                            className="group-data-[collapsible=icon]:hidden shrink-0 flex items-center"
                          >
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          </motion.div>
                        </SidebarMenuButton>

                        <AnimatePresence initial={false}>
                          {isOpen && item.subMenu && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{
                                height: { type: 'spring', stiffness: 350, damping: 30 },
                                opacity: { duration: 0.2 }
                              }}
                              className="overflow-hidden group-data-[collapsible=icon]:hidden"
                            >
                              <SidebarMenuSub className="my-1 space-y-0.5 border-l border-border/50 pl-3">
                                {item.subMenu.map((subItem) => {
                                  const isSubItemActive = isItemHrefActive(
                                    subItem.href,
                                    pathname,
                                    searchParams
                                  );

                                  return (
                                    <SidebarMenuSubItem key={`${subItem.title}-${subItem.href}`}>
                                      <SidebarMenuSubButton
                                        isActive={isSubItemActive}
                                        render={<Link href={subItem.href} />}
                                        className={`h-8.5 rounded-xl px-3 text-xs transition-all duration-200 ${
                                          isSubItemActive
                                            ? 'bg-primary/10 text-primary font-bold shadow-2xs'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 font-medium'
                                        }`}
                                      >
                                        <span>{subItem.title}</span>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  );
                                })}
                              </SidebarMenuSub>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.title}
                        render={<Link href={item.href} />}
                        className={`h-10 rounded-2xl px-3.5 group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center transition-all duration-200 ${
                          isActive
                            ? 'bg-primary! text-primary-foreground! font-bold shadow-xs hover:bg-primary/90! hover:text-primary-foreground!'
                            : 'hover:bg-muted/80 text-muted-foreground hover:text-foreground font-medium'
                        }`}
                      >
                        {Icon && <Icon className="h-4 w-4 shrink-0" />}
                        <span className="text-sm group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-border/40 group-data-[collapsible=icon]:p-1.5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleSidebar}
              tooltip={isCollapsed ? 'Perluas Sidebar (Ctrl+B)' : 'Ciutkan Sidebar'}
              className="h-9 rounded-xl px-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all cursor-pointer group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center"
            >
              <PanelLeft className="h-4 w-4 shrink-0" />
              <span className="text-xs font-semibold flex-1 group-data-[collapsible=icon]:hidden">
                Ciutkan Sidebar
              </span>
              <kbd className="hidden sm:inline-block text-[10px] font-mono text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded border border-border/40 group-data-[collapsible=icon]:hidden">
                Ctrl+B
              </kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function SidebarSkeletonFallback() {
  return (
    <Sidebar variant="floating" collapsible="icon" className="shrink-0">
      <SidebarHeader className="p-3.5 group-data-[collapsible=icon]:p-2 border-b border-border/30">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="h-9 w-9 rounded-xl bg-muted animate-pulse" />
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3 group-data-[collapsible=icon]:px-2">
        <div className="space-y-2 p-1 mt-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 w-full rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export default function AppSidebar() {
  return (
    <React.Suspense fallback={<SidebarSkeletonFallback />}>
      <AppSidebarInner />
    </React.Suspense>
  );
}
