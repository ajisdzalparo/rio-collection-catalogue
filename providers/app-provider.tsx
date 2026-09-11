'use client';

import { ThemeProvider } from './theme-provider';
import QueryClient from './query-provider';
import { ActionLoadingOverlay } from '@/components/shared/action-loading-overlay';

export default function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <QueryClient>
        {children}
        <ActionLoadingOverlay />
      </QueryClient>
    </ThemeProvider>
  );
}
