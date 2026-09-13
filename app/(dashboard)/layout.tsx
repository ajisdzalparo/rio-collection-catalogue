'use client';

import AppHeader from '@/components/layout/app-header';
import AppSidebar from '@/components/layout/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen w-full max-w-full bg-background p-1.5 sm:p-4 transition-colors duration-300 overflow-x-hidden">
      <SidebarProvider className="min-h-[calc(100vh-1rem)] sm:min-h-[calc(100vh-2rem)] w-full max-w-full bg-transparent flex items-stretch min-w-0">
        <AppSidebar />
        <SidebarInset className="bg-transparent flex flex-col flex-1 min-w-0 max-w-full min-h-[calc(100vh-1rem)] sm:min-h-[calc(100vh-2rem)]">
          <div className="equa-main-panel flex-1 flex flex-col min-h-full min-w-0 max-w-full p-3 sm:p-6 md:p-8">
            <AppHeader />
            <main className="flex-1 w-full min-w-0 max-w-full flex flex-col pt-4 sm:pt-6">{children}</main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
