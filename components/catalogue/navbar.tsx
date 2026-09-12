'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Search, Menu, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileNav } from '@/components/catalogue/mobile-nav';
import { SearchModal } from '@/components/catalogue/search-modal';
import { CartButton } from '@/components/catalogue/cart-button';
import { CartDrawer } from '@/components/catalogue/cart-drawer';
import { useCustomerStore } from '@/lib/customer-store';

const emptySubscribe = () => () => {};

const NAV_LINKS = [
  { href: '/catalogue', label: 'Catalogue' },
  { href: '/archive', label: 'Archive' },
  { href: '/journal', label: 'Journal' },
  { href: '/about', label: 'About' }
] as const;

interface CatalogueNavbarProps {
  storeName?: string;
  className?: string;
}

export function CatalogueNavbar({ storeName, className }: CatalogueNavbarProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const { isAuthenticated, customer } = useCustomerStore();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 w-full bg-(--cat-surface)/95 backdrop-blur-sm border-b border-(--cat-stone)/50',
          className
        )}
      >
        <div className="mx-auto max-w-350 px-4 md:px-16 h-16 flex items-center justify-between">
          {/* Left: Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-eb-garamond text-[24px] md:text-[28px] font-normal tracking-[-0.01em] text-(--cat-on-surface) whitespace-nowrap">
              {storeName}
            </span>
          </Link>

          {/* Right: Menus & Actions */}
          <div className="flex items-center gap-5 md:gap-8">
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

            {/* Action Icons */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3.5">
              {/* Search Icon */}
              <button
                aria-label="Search"
                onClick={() => setSearchModalOpen(true)}
                className="w-9 h-9 flex items-center justify-center text-(--cat-on-surface) hover:opacity-70 transition-opacity cursor-pointer"
              >
                <Search size={18} strokeWidth={1.5} />
              </button>

              {/* Shopping Cart Drawer Trigger */}
              <CartButton className="w-9 h-9" />

              {/* Customer Account / Login (Desktop) */}
              <Link
                href={mounted && isAuthenticated ? '/customer/account' : '/customer/login'}
                aria-label={mounted && isAuthenticated ? 'Akun Saya' : 'Masuk Akun'}
                className="hidden md:flex w-9 h-9 items-center justify-center text-(--cat-on-surface) hover:opacity-70 transition-opacity cursor-pointer relative"
                title={mounted && isAuthenticated ? (customer?.fullName || customer?.email || 'Akun Saya') : 'Masuk Akun'}
              >
                <User size={18} strokeWidth={1.5} />
                {mounted && isAuthenticated && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-(--cat-surface)" />
                )}
              </Link>

              {/* Mobile Hamburger */}
              <button
                aria-label="Open navigation menu"
                className="md:hidden w-9 h-9 flex items-center justify-center text-(--cat-on-surface) hover:opacity-70 transition-opacity cursor-pointer relative"
                onClick={() => setMobileNavOpen(true)}
              >
                <Menu size={20} strokeWidth={1.5} />
                {mounted && isAuthenticated && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-(--cat-surface)" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Interactive Search Modal */}
      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />

      {/* Mobile Nav Overlay */}
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} storeName={storeName} />
    </>
  );
}
