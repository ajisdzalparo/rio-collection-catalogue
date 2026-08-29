import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Roles & Users
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();

  await prisma.role.createMany({
    data: [
      {
        name: 'Admin',
        permissions: { viewOverview: true, manageOrders: true, manageProducts: true, manageJournal: true, viewReports: true, manageSettings: true }
      },
      {
        name: 'Developer',
        permissions: { viewOverview: true, manageOrders: true, manageProducts: true, manageJournal: true, viewReports: true, manageSettings: true }
      },
      {
        name: 'Manager',
        permissions: { viewOverview: true, manageOrders: true, manageProducts: true, manageJournal: true, viewReports: true, manageSettings: false }
      },
      {
        name: 'Sales',
        permissions: { viewOverview: true, manageOrders: true, manageProducts: false, manageJournal: false, viewReports: false, manageSettings: false }
      },
      {
        name: 'Designer',
        permissions: { viewOverview: true, manageOrders: false, manageProducts: true, manageJournal: true, viewReports: false, manageSettings: false }
      }
    ]
  });

  await prisma.user.createMany({
    data: [
      { id: 'usr-1', name: 'Ajis Johnson', role: 'Admin', email: 'Ajis@example.com', status: 'active' },
      { id: 'usr-2', name: 'Sarah Connor', role: 'Developer', email: 'sarah@example.com', status: 'active' },
      { id: 'usr-3', name: 'Michael Scott', role: 'Manager', email: 'michael@example.com', status: 'active' },
      { id: 'usr-4', name: 'Dwight Schrute', role: 'Sales', email: 'dwight@example.com', status: 'inactive' },
      { id: 'usr-5', name: 'Pam Beesly', role: 'Designer', email: 'pam@example.com', status: 'active' }
    ]
  });

  // 2. Categories, Colors, Sizes
  await prisma.category.deleteMany();
  await prisma.category.createMany({
    data: [
      { id: 'cat-1', name: 'Heavy-Weight', slug: 'heavy-weight', description: 'Kaos berbobot tebal berkualitas tinggi' },
      { id: 'cat-2', name: 'Graphic Edition', slug: 'graphic-edition', description: 'Kaos dengan sablon seni visual grafis' },
      { id: 'cat-3', name: 'Core Silhouette', slug: 'core-silhouette', description: 'Potongan siluet dasar brand' }
    ]
  });

  await prisma.color.deleteMany();
  await prisma.color.createMany({
    data: [
      { id: 'col-1', name: 'Hitam', hex: '#1A1A1A' },
      { id: 'col-2', name: 'Putih', hex: '#FAFAFA' },
      { id: 'col-3', name: 'Abu-abu', hex: '#B0B0B0' },
      { id: 'col-4', name: 'Navy', hex: '#1B2A4A' }
    ]
  });

  await prisma.size.deleteMany();
  await prisma.size.createMany({
    data: [
      { size: 'S', isActive: true },
      { size: 'M', isActive: true },
      { size: 'L', isActive: true },
      { size: 'XL', isActive: true },
      { size: 'XXL', isActive: true },
      { size: 'XXXL', isActive: false }
    ]
  });

  // 3. Products & Variants
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();

  const productsData = [
    {
      id: 'prod-001',
      name: 'Heavy-Weight Boxy Tee',
      slug: 'heavy-weight-boxy-tee',
      color: 'Hitam',
      colorHex: '#1A1A1A',
      price: 450000,
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
      variants: [
        { size: 'S', inStock: true },
        { size: 'M', inStock: true },
        { size: 'L', inStock: false },
        { size: 'XL', inStock: true }
      ]
    },
    {
      id: 'prod-002',
      name: 'Graphic Edition 01',
      slug: 'graphic-edition-01',
      color: 'Putih',
      colorHex: '#FAFAFA',
      price: 550000,
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
      variants: [
        { size: 'S', inStock: true },
        { size: 'M', inStock: true },
        { size: 'L', inStock: true },
        { size: 'XL', inStock: false }
      ]
    },
    {
      id: 'prod-003',
      name: 'Core Silhouette',
      slug: 'core-silhouette',
      color: 'Abu-abu',
      colorHex: '#B0B0B0',
      price: 450000,
      status: 'SOLD_OUT',
      edition: 'Edition 001',
      category: 'core-silhouette',
      imageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'
      ],
      description: 'The foundational garment for any minimalist wardrobe. Stripped of unnecessary details to focus purely on shape and texture.',
      variants: [
        { size: 'S', inStock: false },
        { size: 'M', inStock: false },
        { size: 'L', inStock: false },
        { size: 'XL', inStock: false }
      ]
    },
    {
      id: 'prod-004',
      name: 'Essential Oversized',
      slug: 'essential-oversized',
      color: 'Putih',
      colorHex: '#FAFAFA',
      price: 480000,
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
      variants: [
        { size: 'S', inStock: true },
        { size: 'M', inStock: true },
        { size: 'L', inStock: true },
        { size: 'XL', inStock: true }
      ]
    },
    {
      id: 'prod-005',
      name: 'Midnight Structure',
      slug: 'midnight-structure',
      color: 'Navy',
      colorHex: '#1B2A4A',
      price: 470000,
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
        { size: 'S', inStock: false },
        { size: 'M', inStock: false },
        { size: 'L', inStock: false },
        { size: 'XL', inStock: false }
      ]
    }
  ];

  for (const item of productsData) {
    const { variants, ...prod } = item;
    await prisma.product.create({
      data: {
        ...prod,
        variants: {
          createMany: {
            data: variants
          }
        }
      }
    });
  }

  // 4. Archives
  await prisma.archive.deleteMany();
  await prisma.archive.createMany({
    data: [
      {
        id: 'arch-001',
        name: 'Edition 00 — Genesis',
        slug: 'edition-00-genesis',
        status: 'SOLD_OUT',
        imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
        description: 'The inaugural drop that started it all. Raw construction, zero compromise.'
      },
      {
        id: 'arch-002',
        name: 'Edition 00 — Proto',
        slug: 'edition-00-proto',
        status: 'SOLD_OUT',
        imageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop&q=80',
        description: 'Prototype series exploring fabric weight and architectural draping.'
      }
    ]
  });

  // 5. Topics & Journals
  await prisma.topic.deleteMany();
  await prisma.topic.createMany({
    data: [
      { id: 'top-1', name: 'PROSES KREATIF', description: 'Dokumentasi proses perancangan produk' },
      { id: 'top-2', name: 'CULTURE', description: 'Artikel seputar budaya dan brand lifestyle' },
      { id: 'top-3', name: 'PROCESS', description: 'Langkah pengerjaan sablon dan bahan' },
      { id: 'top-4', name: 'DESIGN', description: 'Estetika desain pakaian minimalis' },
      { id: 'top-5', name: 'MATERIAL STUDY', description: 'Pembahasan jenis kain katun bersertifikat' }
    ]
  });

  await prisma.journal.deleteMany();
  await prisma.journal.createMany({
    data: [
      {
        id: 'journal-001',
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
          'Konstruksi kerah menjadi area fokus berikutnya. Rib tebal yang dijahit ganda tidak hanya menjamin bentuk kerah dari peregangan seiring waktu, tetapi juga memberikan aksen visual yang tegas.',
          'Hasil akhirnya adalah lebih dari sekadar t-shirt. Ia adalah sebuah pernyataan tentang nilai-nilai yang kami pegang.'
        ]
      },
      {
        id: 'journal-002',
        date: '28 September 2024',
        slug: 'melihat-di-balik-layar',
        title: 'Melihat di Balik Layar: Arsitektur Sebuah Koleksi',
        author: 'RIO COLLECTION Editorial Team',
        excerpt: 'Eksplorasi material mentah dan siluet brutalist dalam proses perancangan Archive Series.',
        category: 'PROSES KREATIF',
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
        content: [
          'Setiap koleksi dimulai dari keheningan. Bukan keheningan yang kosong, tetapi keheningan yang penuh dengan kemungkinan.',
          'Archive Series lahir dari eksperimen panjang dengan konstruksi garmen yang tidak konvensional.',
          'Hasilnya adalah koleksi yang berbicara melalui detail-detail kecil: kelim yang dikerjakan dengan tangan dan label yang dijahit menggunakan teknik tradisional.'
        ]
      }
    ]
  });

  // 6. Testimonies
  await prisma.testimony.deleteMany();
  await prisma.testimony.createMany({
    data: [
      { id: 'test-1', alt: 'Customer WhatsApp Chat Screenshot 1', imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80' },
      { id: 'test-2', alt: 'Customer WhatsApp Chat Screenshot 2', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80' },
      { id: 'test-3', alt: 'Customer WhatsApp Chat Screenshot 3', imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80' }
    ]
  });

  // 7. Orders & Items
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();

  await prisma.order.create({
    data: {
      id: 'ord-001',
      orderNumber: 'RC-8801',
      fullName: 'Budi Santoso',
      whatsapp: '628123456789',
      address: 'Jl. Merdeka No. 10, Jakarta Pusat, DKI Jakarta',
      notes: 'Tolong diproses cepat ya.',
      totalPrice: 450000,
      status: 'PENDING',
      items: {
        create: [
          {
            name: 'Heavy-Weight Boxy Tee',
            size: 'L',
            price: 450000,
            quantity: 1,
            productId: 'prod-001'
          }
        ]
      }
    }
  });

  await prisma.order.create({
    data: {
      id: 'ord-002',
      orderNumber: 'RC-8802',
      fullName: 'Clara Sinta',
      whatsapp: '628987654321',
      address: 'Apartemen Belmont Residence Tower Mont Blanc Lt. 12, Jakarta Barat',
      notes: '',
      totalPrice: 1100000,
      status: 'PAID',
      items: {
        create: [
          {
            name: 'Graphic Edition 01',
            size: 'M',
            price: 550000,
            quantity: 2,
            productId: 'prod-002'
          }
        ]
      }
    }
  });

  // 8. Store Settings
  await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {
      storeName: 'RIO COLLECTION',
      whatsappNumber: '628123456789',
      bankName: 'BCA',
      bankAccountNumber: '1234567890',
      bankAccountOwner: 'RIO COLLECTION',
      flatShippingRate: 15000
    },
    create: {
      id: 'default',
      storeName: 'RIO COLLECTION',
      whatsappNumber: '628123456789',
      bankName: 'BCA',
      bankAccountNumber: '1234567890',
      bankAccountOwner: 'RIO COLLECTION',
      flatShippingRate: 15000
    }
  });

  console.log('✅ Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
