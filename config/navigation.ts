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
    title: 'Ringkasan',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Pesanan',
    href: '/dashboard/orders',
    icon: ShoppingCart
  },
  {
    title: 'Manajemen Stok',
    href: '/dashboard/stock',
    icon: Boxes
  },
  {
    title: 'Data Master',
    href: '#',
    icon: Database,
    subMenu: [
      { title: 'Produk', href: '/dashboard/products' },
      { title: 'Kategori Kaos', href: '/dashboard/master?tab=categories' },
      { title: 'Warna', href: '/dashboard/master?tab=colors' },
      { title: 'Ukuran', href: '/dashboard/master?tab=sizes' },
      { title: 'Bahan & Perawatan', href: '/dashboard/master?tab=materials' },
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
    title: 'Pelanggan',
    href: '/dashboard/customers',
    icon: Users
  },
  {
    title: 'Testimoni',
    href: '/dashboard/testimonies',
    icon: MessageSquare
  },
  {
    title: 'Manajemen Pengguna',
    href: '#',
    icon: ShieldAlert,
    subMenu: [
      { title: 'Daftar Pengguna', href: '/users?tab=users' },
      { title: 'Peran & Hak Akses', href: '/users?tab=rbac' }
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
    title: 'Keuangan Super Admin',
    href: '/dashboard/super-admin',
    icon: WalletCards
  },
  {
    title: 'Log Aktivitas',
    href: '/dashboard/activity-logs',
    icon: ScrollText
  },
  {
    title: 'Pengaturan Toko',
    href: '/dashboard/settings',
    icon: Settings
  }
];
