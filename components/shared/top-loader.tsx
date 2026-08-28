'use client';

import * as React from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const prevPath = React.useRef(pathname);
  const prevParams = React.useRef(searchParams?.toString());

  const startLoading = React.useCallback(() => {
    setIsLoading(true);
    setProgress(15);

    const timer1 = setTimeout(() => setProgress(45), 100);
    const timer2 = setTimeout(() => setProgress(75), 250);

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

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed top-0 left-0 right-0 z-99999 pointer-events-none h-1 bg-transparent"
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="h-full bg-linear-to-r from-blue-600 via-sky-500 to-teal-400 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
