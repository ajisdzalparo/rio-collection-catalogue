import type { MenuPermissionTree, RolePermissions } from '../types/roles.types';

export const PERMISSION_TREE: MenuPermissionTree[] = [
  {
    id: 'overview',
    menuName: '1. Overview & Dashboard',
    description: 'Akses statistik utama, grafik penjualan, & aktivitas harian toko',
    actions: [
      {
        key: 'overview.view',
        label: 'Lihat Dashboard',
        description: 'Melihat widget ringkasan omzet, grafik, dan pesanan terbaru'
      }
    ]
  },
  {
    id: 'products',
    menuName: '2. Produk & Katalog CMS',
    description: 'Akses pengelolaan katalog kaos, varian ukuran, warna, & detail produk',
    actions: [
      {
        key: 'products.view',
        label: 'Lihat Katalog Produk',
        description: 'Melihat daftar produk dan rincian varian stok'
      },
      {
        key: 'products.create',
        label: 'Tambah Produk',
        description: 'Menambahkan kaos atau varian baru ke katalog toko'
      },
      {
        key: 'products.edit',
        label: 'Edit Produk',
        description: 'Mengubah harga, gambar, deskripsi, dan rincian katalog produk'
      },
      {
        key: 'products.delete',
        label: 'Hapus Produk',
        description: 'Menghapus item produk dari katalog CMS toko'
      }
    ]
  },
  {
    id: 'stock',
    menuName: '3. Stock Management',
    description: 'Akses pengelolaan ketersediaan dan kuantitas stok per varian ukuran',
    actions: [
      {
        key: 'stock.view',
        label: 'Lihat Stok',
        description: 'Melihat ringkasan dan rincian stok seluruh produk'
      },
      {
        key: 'stock.manage',
        label: 'Kelola Stok',
        description: 'Mengubah mode ketersediaan dan kuantitas stok per ukuran'
      }
    ]
  },
  {
    id: 'orders',
    menuName: '4. Pesanan & Transaksi',
    description: 'Akses ke data transaksi pesanan pelanggan & resi pengiriman',
    actions: [
      {
        key: 'orders.view',
        label: 'Lihat Pesanan',
        description: 'Melihat rincian pesanan masuk dari WhatsApp & web'
      },
      {
        key: 'orders.process',
        label: 'Proses Pesanan',
        description: 'Memperbarui status pembayaran & menginput nomor resi'
      },
      {
        key: 'orders.export',
        label: 'Export Data Pesanan',
        description: 'Mengunduh rekapitulasi data transaksi pesanan'
      }
    ]
  },
  {
    id: 'testimonies',
    menuName: '5. Bukti Chat & Testimoni',
    description: 'Akses ke galeri screenshot tangkapan layar bukti kepuasan pelanggan',
    actions: [
      {
        key: 'testimonies.view',
        label: 'Lihat Testimoni',
        description: 'Melihat galeri tangkapan layar chat WhatsApp pelanggan'
      },
      {
        key: 'testimonies.manage',
        label: 'Kelola Testimoni',
        description: 'Upload screenshot baru, ubah keterangan, & hapus testimoni'
      }
    ]
  },
  {
    id: 'journal',
    menuName: '6. Blog & Artikel',
    description: 'Akses ke publikasi konten visual, artikel, & update brand',
    actions: [
      {
        key: 'journal.view',
        label: 'Lihat Artikel Blog',
        description: 'Melihat rincian daftar artikel yang dipublikasikan'
      },
      {
        key: 'journal.manage',
        label: 'Kelola Artikel Blog',
        description: 'Menulis artikel baru, edit draf, & publikasi konten'
      }
    ]
  },
  {
    id: 'settings',
    menuName: '7. Pengaturan Toko & Master Data',
    description: 'Konfigurasi master data, ekspedisi pengiriman, & hero banner',
    actions: [
      {
        key: 'settings.view',
        label: 'Lihat Pengaturan Toko',
        description: 'Melihat halaman pengaturan dan master data toko'
      },
      {
        key: 'settings.manage',
        label: 'Ubah Pengaturan Toko',
        description: 'Mengubah konfigurasi toko, master data, & banner utama'
      }
    ]
  },
  {
    id: 'reports',
    menuName: '8. Laporan Keuangan & HPP',
    description: 'Akses rincian margin profit, omzet bulanan, & perhitungan HPP',
    actions: [
      {
        key: 'reports.view',
        label: 'Lihat Laporan Keuangan',
        description: 'Melihat rincian laporan omzet, profit margin, & HPP toko'
      }
    ]
  },
  {
    id: 'users',
    menuName: '9. Pengguna & Keamanan (RBAC)',
    description: 'Akses pengelolaan akun staf, hak akses role, & reset password',
    actions: [
      {
        key: 'users.view',
        label: 'Lihat Daftar Pengguna',
        description: 'Melihat akun staf terdaftar dan status aktif'
      },
      {
        key: 'users.manage',
        label: 'Tambah & Edit Pengguna',
        description: 'Menambah staf baru atau mengubah detail peran'
      },
      {
        key: 'users.reset_password',
        label: 'Reset Kata Sandi Staf',
        description: 'Mereset dan membuat kata sandi baru untuk akun staf'
      },
      {
        key: 'users.delete',
        label: 'Hapus Akun Pengguna',
        description: 'Menghapus akun staf dari sistem login dashboard'
      }
    ]
  },
  {
    id: 'activity',
    menuName: '10. Activity Log',
    description: 'Riwayat aktivitas penting yang dilakukan pengelola CMS',
    actions: [
      {
        key: 'activity.view',
        label: 'Lihat Activity Log',
        description: 'Melihat pelaku, waktu, dan rincian perubahan pada CMS'
      }
    ]
  }
];

export const DEFAULT_ADMIN_PERMISSIONS: RolePermissions = {
  'overview.view': true,
  'products.view': true,
  'products.create': true,
  'products.edit': true,
  'products.delete': true,
  'stock.view': true,
  'stock.manage': true,
  'orders.view': true,
  'orders.process': true,
  'orders.export': true,
  'testimonies.view': true,
  'testimonies.manage': true,
  'journal.view': true,
  'journal.manage': true,
  'settings.view': true,
  'settings.manage': true,
  'reports.view': true,
  'users.view': true,
  'users.manage': true,
  'users.reset_password': true,
  'users.delete': true,
  // legacy
  viewOverview: true,
  manageOrders: true,
  manageProducts: true,
  manageJournal: true,
  manageSettings: true,
  viewReports: true
};
