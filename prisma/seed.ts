import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting production database seed (Admin Account & System Defaults)...');

  // 1. Seed System Roles
  const roles = [
    {
      name: 'Super Admin',
      permissions: {
        viewOverview: true,
        manageOrders: true,
        manageProducts: true,
        manageJournal: true,
        viewReports: true,
        manageSettings: true,
        manageUsers: true
      }
    },
    {
      name: 'Admin',
      permissions: {
        viewOverview: true,
        manageOrders: true,
        manageProducts: true,
        manageJournal: true,
        viewReports: true,
        manageSettings: true,
        manageUsers: false
      }
    },
    {
      name: 'Developer',
      permissions: {
        viewOverview: true,
        manageOrders: true,
        manageProducts: true,
        manageJournal: true,
        viewReports: true,
        manageSettings: true,
        manageUsers: true
      }
    },
    {
      name: 'Manager',
      permissions: {
        viewOverview: true,
        manageOrders: true,
        manageProducts: true,
        manageJournal: true,
        viewReports: true,
        manageSettings: false,
        manageUsers: false
      }
    },
    {
      name: 'Sales',
      permissions: {
        viewOverview: true,
        manageOrders: true,
        manageProducts: false,
        manageJournal: false,
        viewReports: false,
        manageSettings: false,
        manageUsers: false
      }
    },
    {
      name: 'Designer',
      permissions: {
        viewOverview: true,
        manageOrders: false,
        manageProducts: true,
        manageJournal: true,
        viewReports: false,
        manageSettings: false,
        manageUsers: false
      }
    }
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { permissions: role.permissions },
      create: role
    });
  }
  console.log('✅ Roles initialized');

  // 2. Seed Default Admin User
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@riocollection.com').trim().toLowerCase();
  const adminName = process.env.ADMIN_NAME || 'Admin RIO COLLECTION';

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      role: 'Super Admin',
      status: 'active'
    },
    create: {
      name: adminName,
      email: adminEmail,
      role: 'Super Admin',
      status: 'active'
    }
  });
  console.log(`✅ Default Admin user created/verified: ${user.email}`);

  // 3. Seed Master Sizes
  const defaultSizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  for (const size of defaultSizes) {
    await prisma.size.upsert({
      where: { size },
      update: {},
      create: { size, isActive: true }
    });
  }
  console.log('✅ Master Sizes initialized');

  // 4. Seed Master Banks
  const defaultBanks = [
    { name: 'Bank BCA', code: 'BCA' },
    { name: 'Bank Mandiri', code: 'MANDIRI' },
    { name: 'Bank BNI', code: 'BNI' },
    { name: 'Bank BRI', code: 'BRI' },
    { name: 'Bank Syariah Indonesia', code: 'BSI' },
    { name: 'Bank Permata', code: 'PERMATA' },
    { name: 'Bank CIMB Niaga', code: 'CIMB' },
    { name: 'Bank Jago', code: 'JAGO' }
  ];

  for (const bank of defaultBanks) {
    await prisma.bank.upsert({
      where: { name: bank.name },
      update: { code: bank.code },
      create: { name: bank.name, code: bank.code, isActive: true }
    });
  }
  console.log('✅ Master Banks initialized');

  // 5. Seed Default Store Settings (Default Layout & Settings)
  await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      storeName: 'RIO COLLECTION',
      whatsappNumber: '6281234567890',
      flatShippingRate: 15000,
      heroTitle: 'ARCHIVAL ESSENTIALS',
      heroSubtitle: 'Refined silhouette crafted for longevity and modern character.',
      heroLayout: '2-grid',
      heroCtaText: 'Jelajahi Katalog',
      heroCtaLink: '/catalogue',
      homeManifestoTitle: 'Mendefinisikan Ulang Esensi Kualitas & Estetika.',
      homeManifestoText: 'Setiap karya pakaian dari RIO COLLECTION lahir dari kombinasi riset bahan katun berbobot tinggi, siluet kaku modern, serta detail jahitan presisi.',
      homeBannerText: 'Temukan rilisan edisi terbatas dan koleksi esensial RIO COLLECTION.',
      homeBannerButton: 'Jelajahi Katalog Lengkap'
    }
  });
  console.log('✅ Store Settings initialized');

  console.log('🎉 Production database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
