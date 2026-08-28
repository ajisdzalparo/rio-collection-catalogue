'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_LINKS = [
  { href: '/catalogue', label: 'Catalogue' },
  { href: '/archive', label: 'Archive' },
  { href: '/journal', label: 'Journal' },
  { href: '/about', label: 'About' }
];

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed inset-0 z-50 bg-(--cat-surface) flex flex-col"
        >
          {/* Header with close button */}
          <div className="flex items-center justify-between px-4 h-14">
            <span className="font-eb-garamond text-[20px] font-normal tracking-[-0.01em] text-(--cat-on-surface)">
              RIO COLLECTION
            </span>
            <button
              onClick={onClose}
              aria-label="Close navigation menu"
              className="p-2 text-(--cat-on-surface) hover:opacity-70 transition-opacity cursor-pointer"
            >
              <X size={24} strokeWidth={1.5} />
            </button>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 flex flex-col justify-center px-8 gap-8">
            {NAV_LINKS.map((link, index) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: 0.05 * index,
                  ease: 'easeOut'
                }}
              >
                <Link
                  href={link.href}
                  onClick={onClose}
                  className={cn(
                    'font-eb-garamond text-[42px] font-normal leading-tight',
                    'text-(--cat-on-surface) hover:text-(--cat-on-surface-variant) transition-colors duration-150'
                  )}
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-8 pb-8">
            <p className="font-hanken text-[11px] uppercase tracking-[0.08em] text-(--cat-on-surface-variant)">
              © 2024 RIO COLLECTION
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
