'use client';

import React from 'react';
import { Sparkles, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AiInsightsCard() {
  return (
    <div className="rounded-2xl bg-[#18181B] dark:bg-card border border-border/40 p-6 text-white dark:text-card-foreground shadow-md space-y-4 flex flex-col justify-between w-full">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white">
          <Sparkles className="h-3.5 w-3.5" />
          <span>AI Insights</span>
        </div>
        <button type="button" className="text-white/70 hover:text-white cursor-pointer">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4 rounded-xl bg-white text-slate-900 shadow-xs">
        <p className="text-xs font-semibold leading-relaxed">
          On Wednesday you&apos;re <span className="font-extrabold text-purple-950">overloaded</span>. Should we move 2 tasks to Thursday?
        </p>
      </div>

      <div className="space-y-2 pt-1">
        <Button
          type="button"
          className="w-full h-9 rounded-xl bg-black/40 hover:bg-black/60 text-white border border-white/20 text-xs font-bold transition-all cursor-pointer"
        >
          Ignore
        </Button>
        <Button
          type="button"
          className="w-full h-9 rounded-xl bg-white text-slate-900 hover:bg-white/90 font-extrabold text-xs shadow-xs transition-all cursor-pointer"
        >
          Reschedule
        </Button>
      </div>
    </div>
  );
}
