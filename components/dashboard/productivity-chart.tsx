'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';

const daysData = [
  { day: 'S', height: 'h-10', type: 'inactive' },
  { day: 'M', height: 'h-24', type: 'active', label: '4 hours' },
  { day: 'T', height: 'h-16', type: 'inactive' },
  { day: 'W', height: 'h-32', type: 'active' },
  { day: 'T', height: 'h-28', type: 'striped' },
  { day: 'F', height: 'h-24', type: 'active' },
  { day: 'S', height: 'h-12', type: 'light' }
];

export function ProductivityChart() {
  return (
    <div className="equa-card p-6 space-y-6">
      <div>
        <h3 className="text-base font-bold text-foreground">Productivity Trends</h3>
        <p className="text-xs font-medium text-muted-foreground pt-0.5">Daily focus hours</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-end">
        {/* Weekly Stats Summary Card */}
        <div className="sm:col-span-4 p-4 rounded-2xl bg-muted/50 dark:bg-muted/30 border border-border/40 space-y-2">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-foreground">18</span>
            <span className="text-sm font-bold text-muted-foreground">h</span>
          </div>
          <p className="text-xs font-semibold text-muted-foreground">logged this week</p>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
            <TrendingUp className="h-3 w-3" />
            <span>+12% vs last week</span>
          </div>
        </div>

        {/* Bar Chart Visualization */}
        <div className="sm:col-span-8 flex items-end justify-between gap-3 h-36 px-2">
          {daysData.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 flex-1 group relative">
              {item.label && (
                <div className="absolute -top-7 px-2.5 py-0.5 rounded-full bg-[#18181B] dark:bg-white text-white dark:text-[#18181B] text-[10px] font-bold whitespace-nowrap shadow-sm z-10">
                  {item.label}
                </div>
              )}
              <div
                className={`w-full max-w-9.5 rounded-full transition-all duration-300 ${item.height} ${
                  item.type === 'striped'
                    ? 'bg-[#18181B] dark:bg-white bg-striped-pattern'
                    : item.type === 'active'
                      ? 'bg-[#18181B] dark:bg-white'
                      : item.type === 'light'
                        ? 'bg-foreground/90 dark:bg-white'
                        : 'bg-muted-foreground/15 dark:bg-white/10'
                }`}
              />
              <span className="text-xs font-bold text-muted-foreground">{item.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
