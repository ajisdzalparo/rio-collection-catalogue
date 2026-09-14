'use client';

import AppHeader from '@/components/layout/app-header';
import AppSidebar from '@/components/layout/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-svh w-full max-w-full overflow-x-hidden bg-background p-0 transition-colors duration-300 sm:p-3 lg:p-4">
      <SidebarProvider className="flex min-h-svh w-full min-w-0 max-w-full items-stretch bg-transparent sm:min-h-[calc(100svh-1.5rem)] lg:min-h-[calc(100svh-2rem)]">
        <AppSidebar />
        <SidebarInset className="flex min-h-svh min-w-0 max-w-full flex-1 flex-col bg-transparent sm:min-h-[calc(100svh-1.5rem)] lg:min-h-[calc(100svh-2rem)]">
          <div className="equa-main-panel flex min-h-full min-w-0 max-w-full flex-1 flex-col rounded-none border-x-0 p-3 sm:rounded-2xl sm:border sm:p-5 lg:p-8">
            <AppHeader />
            <main className="flex w-full min-w-0 max-w-full flex-1 flex-col pt-4 sm:pt-6">
              {children}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
