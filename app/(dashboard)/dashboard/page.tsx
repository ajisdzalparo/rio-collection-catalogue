'use client';

import React from 'react';
import { Briefcase, CheckSquare, Hourglass, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductivityChart } from '@/components/dashboard/productivity-chart';
import { TimeTrackerWidget } from '@/components/dashboard/time-tracker-widget';
import { AiInsightsCard } from '@/components/dashboard/ai-insights-card';
import { WorkBalanceChart } from '@/components/dashboard/work-balance-chart';

const topStats = [
  {
    id: 1,
    title: 'projects',
    value: '12',
    subtitle: 'In Progress',
    icon: Briefcase,
    bgIcon: 'bg-black text-white dark:bg-white dark:text-black'
  },
  {
    id: 2,
    title: 'tasks',
    value: '48',
    subtitle: 'Completed',
    icon: CheckSquare,
    bgIcon: 'bg-foreground text-background'
  },
  {
    id: 3,
    title: 'Focus Hours',
    value: '18',
    subtitle: '',
    icon: Hourglass,
    bgIcon: 'bg-muted text-foreground'
  }
];

export default function DashboardPage() {
  return (
    <div className="space-y-8 pb-10">
      {/* Greeting Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Hello, Ajis!
        </h1>
        <p className="text-sm font-semibold text-muted-foreground pt-1">
          Here&apos;s your weekly overview
        </p>
      </div>

      {/* Main Grid: Left Main Column (8 Cols) + Right Column (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top Row: 3 Stat Cards + 1 Activity Time Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {topStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.id}
                  className="equa-card p-5 space-y-4 flex flex-col justify-between"
                >
                  <div
                    className={`h-10 w-10 rounded-2xl ${stat.bgIcon} flex items-center justify-center shadow-xs`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-foreground">{stat.value}</span>
                      <span className="text-xs font-bold text-muted-foreground">{stat.title}</span>
                    </div>
                    {stat.subtitle && (
                      <p className="text-xs font-semibold text-muted-foreground pt-0.5">
                        {stat.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Activity Time Dot Matrix Card */}
            <div className="equa-card p-5 space-y-3 flex flex-col justify-between">
              <div className="h-10 w-10 rounded-2xl bg-muted text-foreground flex items-center justify-center">
                <Hourglass className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-foreground">12</span>
                  <span className="text-xs font-bold text-muted-foreground">days</span>
                </div>
                <p className="text-xs font-semibold text-muted-foreground">Activity time</p>
              </div>
              {/* Dot Matrix Grid */}
              <div className="grid grid-cols-8 gap-1.5 pt-1">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2.5 w-2.5 rounded-full ${
                      i < 10 ? 'bg-orange-500' : 'bg-muted-foreground/20'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Middle: Productivity Trends Bar Chart */}
          <ProductivityChart />

          {/* Bottom Split: Time Tracker + Reminders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inverted Time Tracker Arc Gauge Widget */}
            <TimeTrackerWidget />

            {/* Reminders Card */}
            <div className="equa-card p-6 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Reminders</h3>
                  <p className="text-xs font-medium text-muted-foreground">
                    What&apos;s coming up next:
                  </p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <button type="button" className="p-1.5 rounded-lg hover:bg-muted cursor-pointer">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button type="button" className="p-1.5 rounded-lg hover:bg-muted cursor-pointer">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Today's Meeting Card */}
              <div className="p-4 rounded-2xl bg-muted/50 border border-border/40 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground">Today&apos;s Meeting</h4>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Review campaign results with team.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold">
                      Work
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground">14:00</span>
                  </div>
                </div>

                {/* Google Meet 4-color Logo Icon */}
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-border/60 shadow-xs shrink-0">
                  <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                    <div className="bg-emerald-500 rounded-xs" />
                    <div className="bg-blue-500 rounded-xs" />
                    <div className="bg-amber-500 rounded-xs" />
                    <div className="bg-red-500 rounded-xs" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 Cols): Work-Life Balance + AI Insights */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <WorkBalanceChart />
          <AiInsightsCard />
        </div>
      </div>
    </div>
  );
}
