'use client';

import { cn } from '@/lib/utils';

interface FilterTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

export function FilterTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
}: FilterTabsProps) {
  return (
    <nav
      className={cn('flex items-center gap-6', className)}
      role="tablist"
      aria-label="Filter products"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab)}
            className={cn(
              'relative pb-2 font-[family-name:var(--font-hanken)] text-[12px] font-semibold uppercase tracking-[0.08em] leading-4 transition-colors duration-150 cursor-pointer',
              isActive
                ? 'text-[var(--cat-on-surface)]'
                : 'text-[var(--cat-on-surface-variant)] hover:text-[var(--cat-on-surface)]'
            )}
          >
            {tab}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--cat-charcoal)]" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
