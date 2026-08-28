'use client';

import AppHeader from '@/components/layout/app-header';
import AppSidebar from '@/components/layout/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-background p-4 transition-colors duration-300">
      <SidebarProvider className="min-h-[calc(100vh-2rem)] w-full bg-transparent flex items-stretch">
        <AppSidebar />
        <SidebarInset className="bg-transparent flex flex-col flex-1 min-h-[calc(100vh-2rem)]">
          <div className="equa-main-panel flex-1 flex flex-col min-h-full p-6 sm:p-8">
            <AppHeader />
            <main className="flex-1 w-full flex flex-col pt-6">{children}</main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
