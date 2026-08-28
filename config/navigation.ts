import {
  LayoutDashboard,
  ShoppingCart,
  BookOpen,
  Users,
  Database,
  BarChart3,
  Settings,
  ShieldAlert,
  type LucideIcon,
  MessageSquare
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
    title: 'Orders',
    href: '/dashboard/orders',
    icon: ShoppingCart
  },
  {
    title: 'Master Data',
    href: '#',
    icon: Database,
    subMenu: [
      { title: 'Products', href: '/dashboard/products' },
      { title: 'Kategori Kaos', href: '/dashboard/master?tab=categories' },
      { title: 'Warna (Hex)', href: '/dashboard/master?tab=colors' },
      { title: 'Ukuran (Sizes)', href: '/dashboard/master?tab=sizes' },
      { title: 'Topik Jurnal', href: '/dashboard/master?tab=topics' }
    ]
  },
  {
    title: 'Journal',
    href: '/dashboard/journal',
    icon: BookOpen
  },
  {
    title: 'Customers',
    href: '/dashboard/customers',
    icon: Users
  },
  {
    title: 'Testimonials',
    href: '/dashboard/testimonies',
    icon: MessageSquare
  },
  {
    title: 'User Management',
    href: '#',
    icon: ShieldAlert,
    subMenu: [
      { title: 'User List', href: '/users?tab=users' },
      { title: 'Roles & RBAC', href: '/users?tab=rbac' }
    ]
  },
  {
    title: 'Laporan Penjualan',
    href: '/dashboard/reports',
    icon: BarChart3
  },
  {
    title: 'Store Settings',
    href: '/dashboard/settings',
    icon: Settings
  }
];
