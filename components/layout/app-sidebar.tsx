'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigation } from '@/config/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton
} from '@/components/ui/sidebar';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRbac } from '@/features/users/hooks/use-rbac';
import type { RolePermissions } from '@/features/users/types/roles.types';
import { useStoreSettingsQuery } from '@/hooks/use-store-settings';

const NAVIGATION_PERMISSION_MAP: Record<string, string> = {
  'Overview': 'overview.view',
  'Orders': 'orders.view',
  'Stock Management': 'stock.view',
  'Master Data': 'products.view',
  'Journal': 'journal.view',
  'Testimonials': 'testimonies.view',
  'Laporan Penjualan': 'reports.view',
  'Super Admin Finance': 'platform.finance.view',
  'Activity Log': 'activity.view',
  'Store Settings': 'settings.view',
  'User Management': 'settings.view',
  'Customers': 'orders.view'
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

export default function AppSidebar() {
  const pathname = usePathname();
  const { hasPermission } = useRbac();
  const { data: storeSettings } = useStoreSettingsQuery();
  const storeName = storeSettings?.storeName || 'RIO COLLECTION';

  const [openSubMenus, setOpenSubMenus] = React.useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    navigation.forEach((item) => {
      if (item.subMenu) {
        const isSubActive = item.subMenu.some(
          (sub) => pathname === sub.href || pathname.startsWith(`${sub.href}/`)
        );
        if (isSubActive) {
          initialState[item.title] = true;
        }
      }
    });
    return initialState;
  });

  const toggleSubMenu = (title: string) => {
    setOpenSubMenus((prev) => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  return (
    <Sidebar variant="floating" collapsible="icon" className="shrink-0">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <SidebarBrandMark logoUrl={storeSettings?.logoUrl} storeName={storeName} />
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-extrabold tracking-tight text-base text-foreground">
              {storeName}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 group-data-[collapsible=icon]:px-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent className="mt-1">
            <SidebarMenu className="space-y-1">
              {navigation.map((item) => {
                const permKey = NAVIGATION_PERMISSION_MAP[item.title];
                if (permKey && !hasPermission(permKey as keyof RolePermissions)) {
                  return null;
                }

                const Icon = item.icon;
                const hasSubMenu = Boolean(item.subMenu && item.subMenu.length > 0);
                const isSubActive =
                  hasSubMenu &&
                  item.subMenu?.some(
                    (sub) => pathname === sub.href || pathname.startsWith(`${sub.href}/`)
                  );
                const isActive =
                  !hasSubMenu &&
                  (pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`)));
                const isOpen = openSubMenus[item.title] ?? isSubActive;

                if (hasSubMenu) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={isActive || Boolean(isSubActive)}
                        tooltip={item.title}
                        onClick={() => toggleSubMenu(item.title)}
                        className={`h-10 rounded-2xl px-3.5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center transition-all duration-200 cursor-pointer ${
                          isSubActive
                            ? 'bg-card text-foreground font-bold shadow-2xs border border-border/40'
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
                                const isSubItemActive =
                                  pathname === subItem.href ||
                                  pathname.startsWith(`${subItem.href}/`);

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
                      className={`h-10 rounded-2xl px-3.5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center transition-all duration-200 ${
                        isActive
                          ? 'bg-card text-foreground font-bold shadow-2xs border border-border/40'
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
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
