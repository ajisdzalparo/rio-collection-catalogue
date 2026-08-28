import Link from 'next/link';
import { cn } from '@/lib/utils';

interface CatalogueFooterProps {
  className?: string;
}

const FOOTER_LINKS = [
  {
    title: 'Shop',
    links: [
      { href: '/catalogue', label: 'Catalogue' },
      { href: '/archive', label: 'Archive' },
    ],
  },
  {
    title: 'Brand',
    links: [
      { href: '/journal', label: 'Journal' },
      { href: '/about', label: 'About' },
    ],
  },
  {
    title: 'Info',
    links: [
      { href: '/legal', label: 'Legal' },
      { href: '/terms', label: 'Terms' },
      { href: '/shipping', label: 'Shipping' },
    ],
  },
];

export function CatalogueFooter({ className }: CatalogueFooterProps) {
  return (
    <footer
      className={cn(
        'border-t border-(--cat-stone) bg-(--cat-surface)',
        className
      )}
    >
      <div className="mx-auto max-w-[1400px] px-4 md:px-16 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          {/* Brand Column */}
          <div className="md:col-span-4">
            <Link href="/" className="inline-block">
              <h2 className="font-[family-name:var(--font-eb-garamond)] text-[32px] md:text-[40px] font-normal leading-tight text-(--cat-on-surface)">
                RIO
                <br />
                COLLECTION
              </h2>
            </Link>
            <p className="mt-3 font-[family-name:var(--font-hanken)] text-[11px] uppercase tracking-[0.08em] text-(--cat-on-surface-variant)">
              © 2024 RIO COLLECTION
            </p>
          </div>

          {/* Link Columns */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {FOOTER_LINKS.map((group) => (
              <div key={group.title}>
                <h3 className="font-[family-name:var(--font-hanken)] text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mb-4">
                  {group.title}
                </h3>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="font-[family-name:var(--font-hanken)] text-[14px] font-normal text-(--cat-on-surface) hover:text-(--cat-on-surface-variant) transition-colors duration-150"
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
        <div className="mt-16 pt-6 border-t border-(--cat-stone)/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="font-[family-name:var(--font-hanken)] text-[11px] text-(--cat-on-surface-variant) tracking-wide">
            Curated for the independent.
          </p>
          <div className="flex items-center gap-4">
            {['Instagram', 'Pinterest'].map((social) => (
              <a
                key={social}
                href="#"
                className="font-[family-name:var(--font-hanken)] text-[11px] font-medium uppercase tracking-[0.08em] text-(--cat-on-surface-variant) hover:text-(--cat-on-surface) transition-colors duration-150"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
