import React from 'react';
import Link from 'next/link';
import { cn, formatWaNumber } from '@/lib/utils';
import {
  InstagramIcon,
  TikTokIcon,
  PinterestIcon,
  FacebookIcon,
  XTwitterIcon,
  WhatsAppIcon
} from '@/components/icons/social-icons';
import type { StoreSettings } from '@/hooks/use-store-settings';

interface CatalogueFooterProps {
  settings?: Partial<StoreSettings> | null;
  className?: string;
}

const FOOTER_LINKS = [
  {
    title: 'Shop',
    links: [
      { href: '/catalogue', label: 'Catalogue' },
      { href: '/archive', label: 'Archive' }
    ]
  },
  {
    title: 'Brand',
    links: [
      { href: '/journal', label: 'Blog' },
      { href: '/about', label: 'About' }
    ]
  },
  {
    title: 'Info',
    links: [
      { href: '/legal', label: 'Legal' },
      { href: '/terms', label: 'Terms' },
      { href: '/shipping', label: 'Shipping' }
    ]
  }
];

export function CatalogueFooter({ settings, className }: CatalogueFooterProps) {
  const storeName = settings?.storeName;
  const instagramUrl = settings?.instagramUrl;
  const tiktokUrl = settings?.tiktokUrl;
  const facebookUrl = settings?.facebookUrl;
  const pinterestUrl = settings?.pinterestUrl;
  const xTwitterUrl = settings?.xTwitterUrl;
  const whatsappNumber = settings?.whatsappNumber;

  const nameParts = storeName ? storeName.trim().split(/\s+/) : [];
  const firstNamePart = nameParts[0] ?? '';
  const restNamePart = nameParts.slice(1).join(' ');

  const rawSocials: { name: string; url: string | null | undefined; icon: React.ReactNode }[] = [
    { name: 'Instagram', url: instagramUrl, icon: <InstagramIcon className="shrink-0" /> },
    { name: 'TikTok', url: tiktokUrl, icon: <TikTokIcon className="shrink-0" /> },
    { name: 'Pinterest', url: pinterestUrl, icon: <PinterestIcon className="shrink-0" /> },
    { name: 'Facebook', url: facebookUrl, icon: <FacebookIcon className="shrink-0" /> },
    { name: 'X / Twitter', url: xTwitterUrl, icon: <XTwitterIcon className="shrink-0" /> },
    {
      name: 'WhatsApp',
      url: whatsappNumber ? `https://wa.me/${formatWaNumber(whatsappNumber)}` : undefined,
      icon: <WhatsAppIcon size={14} className="shrink-0" />
    }
  ];

  const socialLinks = rawSocials.filter(
    (item): item is { name: string; url: string; icon: React.ReactNode } =>
      typeof item.url === 'string' && item.url.trim() !== ''
  );

  return (
    <footer className={cn('border-t border-(--cat-stone) bg-(--cat-surface)', className)}>
      <div className="mx-auto max-w-350 px-4 md:px-16 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          {/* Brand Column */}
          <div className="md:col-span-4">
            <Link href="/" className="inline-block">
              <h2 className="font-eb-garamond text-[32px] md:text-[40px] font-normal leading-tight text-(--cat-on-surface)">
                {firstNamePart}
                {restNamePart && (
                  <>
                    <br />
                    {restNamePart}
                  </>
                )}
              </h2>
            </Link>
            <p className="mt-3 font-hanken text-[11px] uppercase tracking-[0.08em] text-(--cat-on-surface-variant)">
              © {new Date().getFullYear()} {storeName}
            </p>
          </div>

          {/* Link Columns */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {FOOTER_LINKS.map((group) => (
              <div key={group.title}>
                <h3 className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mb-4">
                  {group.title}
                </h3>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="font-hanken text-[14px] font-normal text-(--cat-on-surface) hover:text-(--cat-on-surface-variant) transition-colors duration-150"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-6 border-t border-(--cat-stone)/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="font-hanken text-[11px] text-(--cat-on-surface-variant) tracking-wide">
            Curated for the independent.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) hover:text-(--cat-on-surface) transition-colors duration-150 flex items-center gap-1.5 py-1 px-2.5 rounded-md hover:bg-(--cat-stone)/20 border border-transparent hover:border-(--cat-stone)/40"
              >
                {social.icon}
                <span>{social.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
