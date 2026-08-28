'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileNav } from '@/components/catalogue/mobile-nav';

const NAV_LINKS = [
  { href: '/catalogue', label: 'Catalogue' },
  { href: '/archive', label: 'Archive' },
  { href: '/journal', label: 'Journal' },
  { href: '/about', label: 'About' },
];

interface CatalogueNavbarProps {
  className?: string;
}

export function CatalogueNavbar({ className }: CatalogueNavbarProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 w-full bg-(--cat-surface)/95 backdrop-blur-sm border-b border-(--cat-stone)/50',
          className
        )}
      >
        <div className="mx-auto max-w-[1400px] px-4 md:px-16 h-16 flex items-center justify-between">
          {/* Left: Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-eb-garamond text-[24px] md:text-[28px] font-normal tracking-[-0.01em] text-(--cat-on-surface) whitespace-nowrap">
              RIO COLLECTION
            </span>
          </Link>

          {/* Right: Menus & Actions */}
          <div className="flex items-center gap-6 md:gap-8">
            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-hanken text-[12px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) hover:text-(--cat-on-surface) transition-colors duration-150"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Search Icon & Mobile Menu Trigger */}
            <div className="flex items-center gap-3">
              <button
                aria-label="Search"
                className="p-1.5 text-(--cat-on-surface) hover:opacity-70 transition-opacity cursor-pointer"
              >
                <Search size={18} strokeWidth={1.5} />
              </button>

              {/* Mobile Hamburger */}
              <button
                aria-label="Open navigation menu"
                className="md:hidden p-1.5 text-(--cat-on-surface) hover:opacity-70 transition-opacity cursor-pointer"
                onClick={() => setMobileNavOpen(true)}
              >
                <Menu size={20} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
    </>
  );
}
