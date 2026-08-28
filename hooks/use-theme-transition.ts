'use client';

import * as React from 'react';
import { flushSync } from 'react-dom';
import { useTheme } from 'next-themes';

export function useThemeTransition() {
  const { theme, setTheme } = useTheme();

  const changeTheme = React.useCallback(
    (newTheme: string) => {
      if (
        typeof document === 'undefined' ||
        !('startViewTransition' in document) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        setTheme(newTheme);
        return;
      }

      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        flushSync(() => {
          setTheme(newTheme);
        });
      });
    },
    [setTheme]
  );

  return { theme, changeTheme, setTheme };
}
