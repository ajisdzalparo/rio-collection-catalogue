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
      { title: 'Produk', href: '/dashboard/master/products' },
      { title: 'Kategori Kaos', href: '/dashboard/master/kategori' },
      { title: 'Warna', href: '/dashboard/master/warna' },
      { title: 'Ukuran', href: '/dashboard/master/ukuran' },
      { title: 'Bahan & Perawatan', href: '/dashboard/master/bahan' },
      { title: 'Topik Blog', href: '/dashboard/master/topik-blog' },
      { title: 'Master Bank', href: '/dashboard/master/bank' }
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
      { title: 'Daftar Pengguna', href: '/manajemen-pengguna/user' },
      { title: 'Peran & Hak Akses', href: '/manajemen-pengguna/role' }
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
