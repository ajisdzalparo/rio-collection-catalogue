'use client';

import * as React from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const prevPath = React.useRef(pathname);
  const prevParams = React.useRef(searchParams?.toString());

  const startLoading = React.useCallback(() => {
    setIsLoading(true);
    setProgress(20);

    const timer1 = setTimeout(() => setProgress(55), 100);
    const timer2 = setTimeout(() => setProgress(80), 250);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const finishLoading = React.useCallback(() => {
    setProgress(100);
    const timer = setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    const currentParams = searchParams?.toString();
    if (prevPath.current !== pathname || prevParams.current !== currentParams) {
      finishLoading();
      prevPath.current = pathname;
      prevParams.current = currentParams;
    }
  }, [pathname, searchParams, finishLoading]);

  React.useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a');

      if (!anchor) return;

      const href = anchor.getAttribute('href');
      const targetAttr = anchor.getAttribute('target');

      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('#') &&
        targetAttr !== '_blank' &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        const currentUrl = `${window.location.pathname}${window.location.search}`;
        if (href !== currentUrl) {
          startLoading();
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, [startLoading]);

  if (!isLoading && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-99999 pointer-events-none h-0.75 bg-transparent transition-opacity duration-200"
      style={{ opacity: isLoading ? 1 : 0 }}
    >
      <div
        className="h-full bg-[#18181b] shadow-[0_0_8px_rgba(24,24,27,0.4)] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          backgroundColor: 'var(--cat-charcoal, #18181b)'
        }}
      />
    </div>
  );
}
