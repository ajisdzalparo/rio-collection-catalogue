'use client';

import React from 'react';

export function WorkBalanceChart() {
  return (
    <div className="equa-card p-6 space-y-4 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Work-Life Balance</h3>
      </div>

      {/* Donut Ring Chart */}
      <div className="relative flex items-center justify-center py-2">
        <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 36 36">
          {/* Life Arc Background (35%) */}
          <path
            className="text-[#DDD6FE] dark:text-purple-950/80"
            strokeWidth="4"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {/* Work Arc (65%) */}
          <path
            className="text-foreground"
            strokeWidth="4"
            strokeDasharray="65, 100"
            strokeLinecap="round"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-foreground">Balance</span>
          <span className="text-[10px] font-medium text-muted-foreground">This week</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2.5 pt-3 border-t border-border/60 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-md bg-muted-foreground/30" />
            <span className="text-muted-foreground font-semibold">Work</span>
          </div>
          <span className="font-extrabold text-foreground">65%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-md bg-foreground" />
            <span className="text-muted-foreground font-semibold">Life</span>
          </div>
          <span className="font-extrabold text-foreground">35%</span>
        </div>
      </div>
    </div>
  );
}
