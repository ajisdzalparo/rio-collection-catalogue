'use client';

import React, { useState } from 'react';
import { Pause, Square, Play } from 'lucide-react';

export function TimeTrackerWidget() {
  const [isRunning, setIsRunning] = useState(true);

  return (
    <div className="equa-inverted-card p-6 flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-tight">Time Tracker</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/10 hover:bg-foreground/20 transition-colors cursor-pointer"
          >
            {isRunning ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition-colors cursor-pointer shadow-xs"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </button>
        </div>
      </div>

      {/* Arc Gauge Arc & Digital Display */}
      <div className="relative flex flex-col items-center justify-center py-1">
        <svg className="w-48 h-24" viewBox="0 0 100 55">
          {/* Background Arc */}
          <path
            d="M 12 50 A 38 38 0 0 1 88 50"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Active Primary Arc */}
          <path
            d="M 12 50 A 38 38 0 0 1 78 22"
            fill="none"
            stroke="#7C3AED"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight -mt-5.5">40:38</span>
      </div>
    </div>
  );
}
