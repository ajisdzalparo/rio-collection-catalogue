import {
  LayoutDashboard,
  FolderKanban,
  Calendar,
  Sparkles,
  Clock,
  BarChart3,
  Component,
  type LucideIcon
} from 'lucide-react';

export interface NavigationItem {
  title: string;
  href: string;
  icon?: LucideIcon;
  subMenu?: NavigationItem[];
}

export const navigation: NavigationItem[] = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Projects',
    href: '/projects',
    icon: FolderKanban
  },
  {
    title: 'Calendar',
    href: '/calendar',
    icon: Calendar
  },
  {
    title: 'AI Insights',
    href: '/ai-insights',
    icon: Sparkles
  },
  {
    title: 'Time Tracker',
    href: '/time-tracker',
    icon: Clock
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    subMenu: [
      {
        title: 'Time Tracker',
        href: '/time-tracker'
      },
      {
        title: 'Users',
        href: '/users'
      }
    ]
  },
  {
    title: 'UI Components',
    href: '/components',
    icon: Component
  }
];
