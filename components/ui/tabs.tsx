'use client';

import * as React from 'react';
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-4 w-full', className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  variant = 'pills',
  ...props
}: TabsPrimitive.List.Props & { variant?: 'pills' | 'line' | 'cards' }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'flex items-center gap-1.5 w-full',
        variant === 'pills' &&
          'inline-flex bg-muted/50 p-1 rounded-lg border border-border/60 text-muted-foreground w-fit',
        variant === 'line' && 'border-b border-border/60 gap-4 rounded-none bg-transparent p-0',
        variant === 'cards' && 'gap-2 bg-transparent p-0',
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  variant = 'pills',
  ...props
}: TabsPrimitive.Tab.Props & { variant?: 'pills' | 'line' | 'cards' }) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold transition-all cursor-pointer select-none disabled:pointer-events-none disabled:opacity-50 group',
        variant === 'pills' &&
          'rounded-md text-muted-foreground hover:text-foreground data-selected:bg-primary data-selected:text-primary-foreground data-selected:shadow-md data-selected:shadow-primary/25',
        variant === 'line' &&
          'pb-2.5 rounded-none border-b-[3px] border-transparent text-muted-foreground hover:text-foreground data-selected:border-primary data-selected:bg-primary/10 data-selected:text-primary data-selected:font-extrabold',
        variant === 'cards' &&
          'rounded-lg border border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/60 data-selected:border-primary data-selected:bg-primary data-selected:text-primary-foreground data-selected:shadow-md data-selected:shadow-primary/25',
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, children, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn('outline-none', className)}
      {...props}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        {children}
      </motion.div>
    </TabsPrimitive.Panel>
  );
}

export interface TabItem {
  value: string;
  label: React.ReactNode;
  icon?: React.ElementType;
  badge?: string | number;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface QuickTabsProps {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (val: string) => void;
  variant?: 'pills' | 'line' | 'cards';
  className?: string;
}

function QuickTabs({
  items,
  defaultValue,
  value,
  onValueChange,
  variant = 'pills',
  className
}: QuickTabsProps) {
  const initialValue = value || defaultValue || (items[0] ? items[0].value : '');

  return (
    <Tabs
      value={value}
      defaultValue={initialValue}
      onValueChange={(val) => onValueChange?.(String(val))}
      className={className}
    >
      <TabsList variant={variant}>
        {items.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              variant={variant}
              disabled={tab.disabled}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.2 text-[10px] font-extrabold text-primary group-data-selected:bg-primary-foreground/25 group-data-selected:text-primary-foreground transition-colors">
                  {tab.badge}
                </span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {items.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, QuickTabs };
