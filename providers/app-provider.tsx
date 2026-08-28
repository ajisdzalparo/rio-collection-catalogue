'use client';

import { ThemeProvider } from './theme-provider';
import QueryClient from './query-provider';

export default function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <QueryClient>{children}</QueryClient>
    </ThemeProvider>
  );
}
