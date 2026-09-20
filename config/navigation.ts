import {
  LayoutDashboard,
  ShoppingCart,
  BookOpen,
  Users,
  Database,
  BarChart3,
  Settings,
  ShieldAlert,
  WalletCards,
  ScrollText,
  type LucideIcon,
  MessageSquare,
  Boxes,
  Gift
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
    title: 'Stock Management',
    href: '/dashboard/stock',
    icon: Boxes
  },
  {
    title: 'Master Data',
    href: '#',
    icon: Database,
    subMenu: [
      { title: 'Products', href: '/dashboard/products' },
      { title: 'Kategori Kaos', href: '/dashboard/master?tab=categories' },
      { title: 'Warna', href: '/dashboard/master?tab=colors' },
      { title: 'Ukuran', href: '/dashboard/master?tab=sizes' },
      { title: 'Bahan & Perawatan', href: '/dashboard/master?tab=materials' },
      { title: 'Edisi / Drop Kaos', href: '/dashboard/master?tab=editions' },
      { title: 'Topik Blog', href: '/dashboard/master?tab=topics' },
      { title: 'Master Bank', href: '/dashboard/master?tab=banks' }
    ]
  },
  {
    title: 'Blog',
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
      { title: 'Roles', href: '/users?tab=rbac' }
    ]
  },
  {
    title: 'Laporan Penjualan',
    href: '/dashboard/reports',
    icon: BarChart3
  },
  {
    title: 'Referral',
    href: '/dashboard/referrals',
    icon: Gift
  },
  {
    title: 'Super Admin Finance',
    href: '/dashboard/super-admin',
    icon: WalletCards
  },
  {
    title: 'Activity Log',
    href: '/dashboard/activity-logs',
    icon: ScrollText
  },
  {
    title: 'Store Settings',
    href: '/dashboard/settings',
    icon: Settings
  }
];
