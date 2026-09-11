import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding (Roles, User, Products, Categories, Colors, Master Data & Settings)...');

  // 1. Roles
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
  console.log('✅ Roles seeded');

  // 2. Default Admin User
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@riocollection.com').trim().toLowerCase();
  const adminName = process.env.ADMIN_NAME || 'Admin RIO COLLECTION';

  await prisma.user.upsert({
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
  console.log(`✅ Admin user seeded: ${adminEmail}`);

  // 3. Master Categories
  const categories = [
    { name: 'Heavy-Weight', slug: 'heavy-weight', description: 'Kaos berbobot tebal 240-280 GSM berkualitas tinggi' },
    { name: 'Graphic Edition', slug: 'graphic-edition', description: 'Kaos dengan sablon seni visual grafis bernilai artistik' },
    { name: 'Core Silhouette', slug: 'core-silhouette', description: 'Potongan siluet dasar esensial brand RIO COLLECTION' }
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, isActive: true },
      create: cat
    });
  }
  console.log('✅ Categories seeded');

  // 4. Master Colors
  const colors = [
    { name: 'Hitam', hex: '#1A1A1A' },
    { name: 'Putih', hex: '#FAFAFA' },
    { name: 'Abu-abu', hex: '#B0B0B0' },
    { name: 'Navy', hex: '#1B2A4A' }
  ];

  for (const col of colors) {
    const existing = await prisma.color.findFirst({ where: { name: col.name } });
    if (existing) {
      await prisma.color.update({ where: { id: existing.id }, data: { hex: col.hex, isActive: true } });
    } else {
      await prisma.color.create({ data: { ...col, isActive: true } });
    }
  }
  console.log('✅ Colors seeded');

  // 5. Master Sizes
  const sizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  for (const size of sizes) {
    await prisma.size.upsert({
      where: { size },
      update: { isActive: true },
      create: { size, isActive: true }
    });
  }
  console.log('✅ Sizes seeded');

  // 6. Products & Variants
  const productsData = [
    {
      name: 'Heavy-Weight Boxy Tee',
      slug: 'heavy-weight-boxy-tee',
      color: 'Hitam',
      colorHex: '#1A1A1A',
      colors: ['Hitam'],
      colorHexes: ['#1A1A1A'],
      price: 450000,
      hpp: 220000,
      stock: 45,
      stockMode: 'QUANTITY',
      status: 'AVAILABLE',
      edition: 'Edition 001',
      category: 'heavy-weight',
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&auto=format&fit=crop&q=80'
      ],
      description: 'A meticulously crafted boxy silhouette made from 100% premium heavy-weight cotton. Designed for durability and comfort.',
      storyTitle: 'The Architecture of Daily Wear',
      storyText: 'Konstruksi siluet boxy dengan jahitan ganda di setiap sambungan menghasilkan jatuhan kain yang tegas dan proporsional.',
      variants: [
        { size: 'S', inStock: true, stock: 12 },
        { size: 'M', inStock: true, stock: 15 },
        { size: 'L', inStock: true, stock: 10 },
        { size: 'XL', inStock: true, stock: 8 }
      ]
    },
    {
      name: 'Graphic Edition 01',
      slug: 'graphic-edition-01',
      color: 'Putih',
      colorHex: '#FAFAFA',
      colors: ['Putih'],
      colorHexes: ['#FAFAFA'],
      price: 550000,
      hpp: 260000,
      stock: 30,
      stockMode: 'QUANTITY',
      status: 'AVAILABLE',
      edition: 'Edition 001',
      category: 'graphic-edition',
      imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&auto=format&fit=crop&q=80'
      ],
      description: 'Limited collaboration graphic tee featuring hand-drawn abstract artwork on premium cotton canvas.',
      storyTitle: 'Visual Rhythm & Monochrome Identity',
      storyText: 'Eksplorasi grafis brutalist dengan teknik sablon manual berdaya tahan tinggi yang menyatu sempurna dengan serat katun.',
      variants: [
        { size: 'S', inStock: true, stock: 8 },
        { size: 'M', inStock: true, stock: 12 },
        { size: 'L', inStock: true, stock: 10 },
        { size: 'XL', inStock: false, stock: 0 }
      ]
    },
    {
      name: 'Essential Oversized',
      slug: 'essential-oversized',
      color: 'Putih',
      colorHex: '#FAFAFA',
      colors: ['Putih', 'Hitam'],
      colorHexes: ['#FAFAFA', '#1A1A1A'],
      price: 480000,
      hpp: 230000,
      stock: 40,
      stockMode: 'QUANTITY',
      status: 'AVAILABLE',
      edition: 'Edition 001',
      category: 'core-silhouette',
      imageUrl: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1200&auto=format&fit=crop&q=80'
      ],
      description: 'An elevated everyday essential with a relaxed oversized fit. Constructed from heavyweight 280gsm cotton.',
      storyTitle: 'Relaxed Silhouette for Everyday Life',
      storyText: 'Dirancang untuk kenyamanan maksimal dalam mobilitas harian dengan drop-shoulder cut yang clean.',
      variants: [
        { size: 'S', inStock: true, stock: 10 },
        { size: 'M', inStock: true, stock: 15 },
        { size: 'L', inStock: true, stock: 10 },
        { size: 'XL', inStock: true, stock: 5 }
      ]
    },
    {
      name: 'Midnight Structure',
      slug: 'midnight-structure',
      color: 'Navy',
      colorHex: '#1B2A4A',
      colors: ['Navy'],
      colorHexes: ['#1B2A4A'],
      price: 470000,
      hpp: 225000,
      stock: 0,
      stockMode: 'QUANTITY',
      status: 'COMING_SOON',
      edition: 'Edition 001',
      category: 'heavy-weight',
      imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&auto=format&fit=crop&q=80'
      ],
      description: 'Architectural precision meets deep indigo dye. A structured silhouette in our signature heavy-weight fabrication.',
      variants: [
        { size: 'S', inStock: false, stock: 0 },
        { size: 'M', inStock: false, stock: 0 },
        { size: 'L', inStock: false, stock: 0 },
        { size: 'XL', inStock: false, stock: 0 }
      ]
    }
  ];

  for (const item of productsData) {
    const { variants, ...prod } = item;
    const existing = await prisma.product.findUnique({ where: { slug: prod.slug } });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          ...prod,
          variants: {
            deleteMany: {},
            create: variants
          }
        }
      });
    } else {
      await prisma.product.create({
        data: {
          ...prod,
          variants: {
            create: variants
          }
        }
      });
    }
  }
  console.log('✅ Products & Variants seeded');

  // 7. Topics & Journals
  const topics = [
    { name: 'PROSES KREATIF', description: 'Dokumentasi proses perancangan produk' },
    { name: 'CULTURE', description: 'Artikel seputar budaya dan brand lifestyle' },
    { name: 'PROCESS', description: 'Langkah pengerjaan sablon dan bahan' },
    { name: 'DESIGN', description: 'Estetika desain pakaian minimalis' },
    { name: 'MATERIAL STUDY', description: 'Pembahasan jenis kain katun bersertifikat' }
  ];

  for (const top of topics) {
    const existing = await prisma.topic.findFirst({ where: { name: top.name } });
    if (!existing) {
      await prisma.topic.create({ data: { ...top, isActive: true } });
    }
  }

  const journals = [
    {
      date: '12 Oktober 2024',
      slug: 'pencarian-katun-sempurna',
      title: 'Pencarian Katun Sempurna',
      author: 'RIO COLLECTION Editorial Team',
      excerpt: 'Dalam dunia pakaian esensial, pencarian akan material yang sempurna seringkali terasa seperti mitos. Bagi kami di RIO COLLECTION, ini adalah sebuah obsesi.',
      category: 'MATERIAL STUDY',
      imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&auto=format&fit=crop&q=80',
      pullQuote: 'Bukan tentang menciptakan sesuatu yang baru, melainkan menyempurnakan sesuatu yang mendasar.',
      relatedProductSlug: 'heavy-weight-boxy-tee',
      content: [
        'Dalam dunia pakaian esensial, pencarian akan material yang sempurna seringkali terasa seperti mitos. Bagi kami di RIO COLLECTION, ini adalah sebuah obsesi.',
        'T-shirt yang baik harus terasa seperti ekstensi dari penggunanya. Ia tidak boleh terlalu ringan, namun harus mempertahankan strukturnya setelah puluhan kali dicucian.',
        'Kami menemukan jawabannya pada katun dengan berat 240gsm. Berat yang tidak lazim untuk iklim tropis, namun krusial untuk menciptakan siluet yang kaku dan maskulin.',
        'Konstruksi kerah menjadi area fokus berikutnya. Rib tebal yang dijahit ganda tidak hanya menjamin bentuk kerah dari peregangan seiring waktu, tetapi juga memberikan aksen visual yang tegas.'
      ]
    },
    {
      date: '28 September 2024',
      slug: 'melihat-di-balik-layar',
      title: 'Melihat di Balik Layar: Arsitektur Sebuah Koleksi',
      author: 'RIO COLLECTION Editorial Team',
      excerpt: 'Eksplorasi material mentah dan siluet brutalist dalam proses perancangan Archive Series.',
      category: 'PROSES KREATIF',
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
      pullQuote: 'Setiap karya lahir dari detail-detail kecil yang tidak terlihat.',
      content: [
        'Setiap koleksi dimulai dari keheningan. Bukan keheningan yang kosong, tetapi keheningan yang penuh dengan kemungkinan.',
        'Archive Series lahir dari eksperimen panjang dengan konstruksi garmen yang tidak konvensional.',
        'Hasilnya adalah koleksi yang berbicara melalui detail-detail kecil: kelim yang dikerjakan dengan tangan dan label yang dijahit presisi.'
      ]
    }
  ];

  for (const jrn of journals) {
    await prisma.journal.upsert({
      where: { slug: jrn.slug },
      update: jrn,
      create: jrn
    });
  }
  console.log('✅ Topics & Journals seeded');

  // 8. Archives
  const archives = [
    {
      name: 'Edition 00 — Genesis',
      slug: 'edition-00-genesis',
      status: 'SOLD_OUT',
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      description: 'The inaugural drop that started it all. Raw construction, zero compromise.'
    },
    {
      name: 'Edition 00 — Proto',
      slug: 'edition-00-proto',
      status: 'SOLD_OUT',
      imageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop&q=80',
      description: 'Prototype series exploring fabric weight and architectural draping.'
    }
  ];

  for (const arc of archives) {
    await prisma.archive.upsert({
      where: { slug: arc.slug },
      update: arc,
      create: arc
    });
  }
  console.log('✅ Archives seeded');

  // 9. Testimonies
  const testimonies = [
    { alt: 'Customer WhatsApp Chat Screenshot 1', imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80', status: 'ACTIVE' },
    { alt: 'Customer WhatsApp Chat Screenshot 2', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80', status: 'ACTIVE' },
    { alt: 'Customer WhatsApp Chat Screenshot 3', imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80', status: 'ACTIVE' }
  ];

  for (const tst of testimonies) {
    const existing = await prisma.testimony.findFirst({ where: { alt: tst.alt } });
    if (!existing) {
      await prisma.testimony.create({ data: tst });
    }
  }
  console.log('✅ Testimonies seeded');

  // 10. Master Banks & Store Banks
  const masterBanks = [
    { name: 'Bank BCA', code: 'BCA' },
    { name: 'Bank Mandiri', code: 'MANDIRI' },
    { name: 'Bank BNI', code: 'BNI' },
    { name: 'Bank BRI', code: 'BRI' },
    { name: 'Bank Syariah Indonesia', code: 'BSI' },
    { name: 'Bank Permata', code: 'PERMATA' },
    { name: 'Bank CIMB Niaga', code: 'CIMB' },
    { name: 'Bank Jago', code: 'JAGO' }
  ];

  for (const bank of masterBanks) {
    await prisma.bank.upsert({
      where: { name: bank.name },
      update: { code: bank.code, isActive: true },
      create: { name: bank.name, code: bank.code, isActive: true }
    });
  }

  const existingStoreBanks = await prisma.storeBank.findMany();
  if (existingStoreBanks.length === 0) {
    await prisma.storeBank.createMany({
      data: [
        { bankName: 'Bank BCA', accountNumber: '1234567890', accountOwner: 'RIO COLLECTION', isActive: true, sortOrder: 1 },
        { bankName: 'Bank Mandiri', accountNumber: '0987654321', accountOwner: 'RIO COLLECTION', isActive: true, sortOrder: 2 }
      ]
    });
  }
  console.log('✅ Master Banks & Store Banks seeded');

  // 11. Store Settings
  await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      storeName: 'RIO COLLECTION',
      whatsappNumber: '628123456789',
      bankName: 'Bank BCA',
      bankAccountNumber: '1234567890',
      bankAccountOwner: 'RIO COLLECTION',
      flatShippingRate: 15000,
      heroTitle: 'ARCHIVAL ESSENTIALS',
      heroSubtitle: 'Refined heavyweight cotton silhouettes crafted for modern character and longevity.',
      heroLayout: '2-grid',
      heroLeftImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      heroRightImage: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
      heroCtaText: 'Jelajahi Koleksi',
      heroCtaLink: '/catalogue',
      homeManifestoTitle: 'Mendefinisikan Ulang Esensi Kualitas & Estetika.',
      homeManifestoText: 'Setiap karya pakaian dari RIO COLLECTION lahir dari kombinasi riset bahan katun berbobot tinggi (240-280 GSM), siluet kaku modern, serta detail jahitan presisi. Kami menghadirkan pakaian esensial tahan lama yang berkarakter.',
      homeManifestoImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
      homeBannerText: 'Temukan rilisan edisi terbatas dan koleksi esensial RIO COLLECTION.',
      homeBannerButton: 'Jelajahi Katalog Lengkap',
      archiveHeaderSub: 'Desain masa lalu dan koleksi arsip rilisan terdahulu yang kami lestarikan.',
      archiveQuoteTitle: 'Merekam jejak perjalanan estetika dan eksperimen material kami.',
      archiveQuoteText: 'Setiap siluet yang telah habis tidak pernah benar-benar hilang, melainkan menjadi bagian dari sejarah dan fondasi karya kami berikutnya.',
      aboutHeroImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
      aboutHeading: 'Independen. Archival. Uncompromising.',
      aboutParagraph1: 'RIO COLLECTION berdiri sebagai studio independen yang berfokus pada eksplorasi pakaian katun berkonstruksi kaku dan bernilai arsip.',
      aboutParagraph2: 'Kami percaya bahwa pakaian esensial tidak harus polos tanpa karakter. Melalui pemilihan kain berkualitas tinggi, potong jahitan yang presisi, serta kuantitas rilisan yang terbatas, setiap produk dirancang untuk tahan lama.',
      aboutValuesTitle: 'Prinsip & Nilai Kami',
      aboutValues: [
        { title: 'Slow & Conscious Design', description: 'Memilih kualitas bahan dan kerapian konstruksi dibanding produksi cepat masal.' },
        { title: 'Archival Cotton Silhouette', description: 'Mengembangkan katun berbobot 240-280 GSM yang mempertahankan struktur kaku siluet.' },
        { title: 'Limited Batch Quantity', description: 'Setiap rilisan dibuat dalam kuantitas terbatas untuk menjaga eksklusivitas karya.' }
      ],
      aboutQuote: 'Bukan tentang menciptakan sesuatu yang baru, melainkan menyempurnakan sesuatu yang mendasar.',
      aboutQuoteText: 'RIO COLLECTION Editorial & Design Team',
      aboutStudioImage: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&auto=format&fit=crop&q=80'
    }
  });
  console.log('✅ Store Settings seeded');

  console.log('🎉 Comprehensive database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
