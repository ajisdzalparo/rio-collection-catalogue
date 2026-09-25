'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';

const PATH_TITLE_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  orders: 'Pesanan',
  stock: 'Manajemen Stok',
  master: 'Data Master',
  products: 'Produk',
  categories: 'Kategori Kaos',
  colors: 'Warna',
  sizes: 'Ukuran',
  materials: 'Bahan & Perawatan',
  topics: 'Topik Blog',
  banks: 'Master Bank',
  journal: 'Blog',
  customers: 'Pelanggan',
  testimonies: 'Testimoni',
  users: 'Manajemen Pengguna',
  roles: 'Peran & Hak Akses',
  rbac: 'Peran & Hak Akses',
  reports: 'Laporan Penjualan',
  referrals: 'Referral',
  'super-admin': 'Keuangan Super Admin',
  'activity-logs': 'Log Aktivitas',
  settings: 'Pengaturan Toko',
  create: 'Tambah Baru',
  edit: 'Edit'
};

export default function AppBreadcrumb() {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter((segment) => segment.length > 0);

  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/dashboard" />}>Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        {pathSegments.map((segment, index) => {
          if (segment === 'dashboard' && index === 0) return null;
          const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
          const isLast = index === pathSegments.length - 1;
          const formattedSegment =
            PATH_TITLE_MAP[segment.toLowerCase()] ||
            segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{formattedSegment}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={href} />}>{formattedSegment}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
