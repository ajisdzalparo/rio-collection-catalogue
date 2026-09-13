'use client';

import { useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  X,
  User,
  ShoppingBag,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';
import { InstagramIcon, WhatsAppIcon } from '@/components/icons/social-icons';
import { cn } from '@/lib/utils';
import { useCustomerStore } from '@/lib/customer-store';
import { useCartStore } from '@/lib/cart-store';
import { useStoreSettingsStore } from '@/hooks/use-store-settings';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  storeName?: string;
}

const emptySubscribe = () => () => {};

const NAV_ITEMS = [
  {
    num: '01',
    href: '/catalogue',
    label: 'Catalogue',
    desc: 'Explore Current Editions'
  },
  {
    num: '02',
    href: '/archive',
    label: 'Archive',
    desc: 'Past Retrospective Pieces'
  },
  {
    num: '03',
    href: '/journal',
    label: 'Blog',
    desc: 'Studio Stories & Craft'
  },
  {
    num: '04',
    href: '/about',
    label: 'About',
    desc: 'Atelier & Philosophy'
  }
] as const;

export function MobileNav({ isOpen, onClose, storeName = 'RIO COLLECTION' }: MobileNavProps) {
  const { isAuthenticated, customer } = useCustomerStore();
  const { getTotalItems, openCart } = useCartStore();
  const { instagramUrl, whatsappNumber } = useStoreSettingsStore();

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

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

  if (!isOpen) return null;

  const totalItems = mounted ? getTotalItems() : 0;
  const isUserLoggedIn = mounted && isAuthenticated;

  const waClean = whatsappNumber ? whatsappNumber.replace(/\D/g, '') : '';
  const waUrl = waClean ? `https://wa.me/${waClean.startsWith('0') ? '62' + waClean.slice(1) : waClean}` : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-(--cat-surface) flex flex-col justify-between overflow-y-auto animate-in fade-in-0 duration-300"
    >
      {/* Top Header */}
      <div className="sticky top-0 z-10 bg-(--cat-surface)/95 backdrop-blur-md flex items-center justify-between px-6 h-16 border-b border-(--cat-stone)/60">
        <Link
          href="/"
          onClick={onClose}
          className="font-eb-garamond text-[22px] tracking-[-0.01em] text-(--cat-on-surface) uppercase"
        >
          {storeName}
        </Link>
        <button
          onClick={onClose}
          aria-label="Close navigation menu"
          className="w-10 h-10 flex items-center justify-center -mr-2 text-(--cat-on-surface) hover:bg-(--cat-surface-container) rounded-full transition-colors cursor-pointer"
        >
          <X size={22} strokeWidth={1.5} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-6 py-8 flex flex-col justify-between gap-10">
        {/* Navigation Menu List */}
        <nav className="flex flex-col divide-y divide-(--cat-stone)/40">
          {NAV_ITEMS.map((item, idx) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'group py-5 flex items-center justify-between transition-all duration-200',
                'hover:translate-x-1'
              )}
              style={{
                animationDelay: `${idx * 60}ms`
              }}
            >
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-[11px] text-(--cat-on-surface-variant)/70 font-semibold tracking-wider">
                  {item.num}
                </span>
                <div>
                  <span className="font-eb-garamond text-[32px] md:text-[36px] font-normal leading-tight text-(--cat-on-surface) group-hover:text-(--cat-charcoal)">
                    {item.label}
                  </span>
                  <p className="font-hanken text-[11px] text-(--cat-on-surface-variant) tracking-[0.04em] uppercase -mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>

              <ArrowUpRight
                size={20}
                strokeWidth={1.5}
                className="text-(--cat-on-surface-variant) opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
              />
            </Link>
          ))}
        </nav>

        {/* Action Center (Customer Card & Cart Button) */}
        <div className="space-y-3 pt-4 border-t border-(--cat-stone)/60">
          {/* Cart Drawer Trigger Card */}
          <button
            onClick={() => {
              onClose();
              openCart();
            }}
            className="w-full flex items-center justify-between p-4 bg-(--cat-surface-container-low) border border-(--cat-stone) hover:border-(--cat-charcoal) transition-all duration-200 cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-(--cat-surface) border border-(--cat-stone) flex items-center justify-center text-(--cat-on-surface) group-hover:bg-(--cat-charcoal) group-hover:text-white transition-colors">
                <ShoppingBag size={18} strokeWidth={1.5} />
              </div>
              <div>
                <span className="block font-hanken text-[12px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface)">
                  Keranjang Belanja
                </span>
                <span className="font-hanken text-[11px] text-(--cat-on-surface-variant)">
                  {totalItems > 0 ? `${totalItems} produk di dalam tas` : 'Tas belanja kosong'}
                </span>
              </div>
            </div>

            {totalItems > 0 ? (
              <span className="px-2.5 py-1 text-[11px] font-mono font-bold bg-(--cat-charcoal) text-white rounded-full">
                {totalItems}
              </span>
            ) : (
              <ChevronRight size={18} className="text-(--cat-on-surface-variant)" />
            )}
          </button>

          {/* Customer Profile / Login Card */}
          <Link
            href={isUserLoggedIn ? '/customer/account' : '/customer/login'}
            onClick={onClose}
            className="w-full flex items-center justify-between p-4 bg-(--cat-surface-container-low) border border-(--cat-stone) hover:border-(--cat-charcoal) transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-full bg-(--cat-surface) border border-(--cat-stone) flex items-center justify-center text-(--cat-on-surface) group-hover:bg-(--cat-charcoal) group-hover:text-white transition-colors shrink-0">
                <User size={18} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <span className="block font-hanken text-[12px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface) truncate">
                  {isUserLoggedIn ? 'Akun Pelanggan' : 'Masuk / Daftar Akun'}
                </span>
                <span className="font-hanken text-[11px] text-(--cat-on-surface-variant) truncate block">
                  {isUserLoggedIn
                    ? customer?.fullName || customer?.email
                    : 'Masuk dengan kode OTP instan'}
                </span>
              </div>
            </div>

            {isUserLoggedIn ? (
              <span className="px-2.5 py-1 text-[10px] font-hanken uppercase tracking-wider font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full shrink-0">
                Aktif
              </span>
            ) : (
              <ChevronRight size={18} className="text-(--cat-on-surface-variant) shrink-0" />
            )}
          </Link>
        </div>
      </div>

      {/* Bottom Footer & Social Links */}
      <div className="px-6 py-6 border-t border-(--cat-stone)/50 bg-(--cat-surface-container-low)/40">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-8 h-8 rounded-full border border-(--cat-stone) flex items-center justify-center text-(--cat-on-surface) hover:bg-(--cat-charcoal) hover:text-white transition-colors"
              >
                <InstagramIcon className="w-3.5 h-3.5 fill-current" />
              </a>
            )}
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp Concierge"
                className="w-8 h-8 rounded-full border border-(--cat-stone) flex items-center justify-center text-(--cat-on-surface) hover:bg-(--cat-charcoal) hover:text-white transition-colors"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
              </a>
            )}
          </div>

          <p className="font-hanken text-[11px] uppercase tracking-[0.08em] text-(--cat-on-surface-variant)">
            © {new Date().getFullYear()} {storeName}
          </p>
        </div>
      </div>
    </div>
  );
}
