import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(
    '🌱 Starting comprehensive database seeding (Roles, User, Products, Categories, Colors, Master Data & Settings)...'
  );

  // 1. Roles
  const roles = [
    {
      name: 'Super Admin',
      description: 'Akses tertinggi ke seluruh sistem dan finance platform',
      isSystemRole: true,
      permissions: {
        viewOverview: true,
        manageOrders: true,
        manageProducts: true,
        'stock.view': true,
        'stock.manage': true,
        manageJournal: true,
        viewReports: true,
        manageSettings: true,
        manageUsers: true,
        'activity.view': true,
        'platform.finance.view': true
      }
    },
    {
      name: 'Owner',
      description: 'Pemilik toko dengan akses penuh operasional selain finance platform',
      isSystemRole: true,
      permissions: {
        viewOverview: true,
        manageOrders: true,
        manageProducts: true,
        'stock.view': true,
        'stock.manage': true,
        manageJournal: true,
        viewReports: true,
        manageSettings: true,
        manageUsers: true,
        'activity.view': true
      }
    },
    {
      name: 'Admin',
      permissions: {
        viewOverview: true,
        manageOrders: true,
        manageProducts: true,
        'stock.view': true,
        'stock.manage': true,
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
        'stock.view': true,
        'stock.manage': true,
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
        'stock.view': true,
        'stock.manage': true,
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
        'stock.view': false,
        'stock.manage': false,
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
        'stock.view': true,
        'stock.manage': true,
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
      update: {
        permissions: role.permissions,
        description: role.description,
        isSystemRole: role.isSystemRole ?? false,
        isActive: true
      },
      create: role
    });
  }
  console.log('✅ Roles seeded');

  // 2. Provision one protected Super Admin and normalize every other CMS user as Owner.
  const superAdminEmail = (
    process.env.SUPER_ADMIN_EMAIL || 'ajisdzalparo22@gmail.com'
  ).trim().toLowerCase();
  const superAdminName = process.env.SUPER_ADMIN_NAME || 'Ajis Dzalparo';

  const [, superAdminUser] = await prisma.$transaction([
    prisma.user.updateMany({
      where: { email: { not: superAdminEmail } },
      data: { role: 'Owner' }
    }),
    prisma.user.upsert({
      where: { email: superAdminEmail },
      update: {
        role: 'Super Admin',
        status: 'active'
      },
      create: {
        name: superAdminName,
        email: superAdminEmail,
        role: 'Super Admin',
        status: 'active'
      }
    })
  ]);
  console.log(`✅ Super Admin seeded: ${superAdminUser.email}; other users normalized as Owner`);

  // 3. Master Categories
  const categories = [
    {
      name: 'Heavy-Weight',
      slug: 'heavy-weight',
      description: 'Kaos berbobot tebal 240-280 GSM berkualitas tinggi'
    },
    {
      name: 'Graphic Edition',
      slug: 'graphic-edition',
      description: 'Kaos dengan sablon seni visual grafis bernilai artistik'
    },
    {
      name: 'Core Silhouette',
      slug: 'core-silhouette',
      description: 'Potongan siluet dasar esensial brand RIO COLLECTION'
    }
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
      await prisma.color.update({
        where: { id: existing.id },
        data: { hex: col.hex, isActive: true }
      });
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

  // 5.5 Master Materials (Fabric & Origin)
  const defaultMaterials = [
    { type: 'ORIGIN' as const, name: 'Indonesia', description: 'Buatan dan manufaktur Indonesia' },
    { type: 'ORIGIN' as const, name: 'Made in Indonesia', description: 'Lokal buatan Indonesia' },
    {
      type: 'ORIGIN' as const,
      name: 'Imported Cotton',
      description: 'Material impor dari luar negeri'
    },
    {
      type: 'FABRIC' as const,
      name: '100% Premium Heavyweight Cotton',
      description: 'Katun tebal premium 240-280 GSM'
    },
    { type: 'FABRIC' as const, name: 'Cotton Combed 24s', description: 'Katun combed 24s lembut' },
    { type: 'FABRIC' as const, name: 'Cotton Combed 30s', description: 'Katun combed 30s ringan' }
  ];

  // Clean up legacy TREATMENT and CARE entries from DB
  await prisma.materialMaster.deleteMany({
    where: { type: { in: ['TREATMENT', 'CARE'] } }
  });

  for (const mat of defaultMaterials) {
    const existing = await prisma.materialMaster.findFirst({
      where: { type: mat.type, name: mat.name }
    });
    if (!existing) {
      await prisma.materialMaster.create({
        data: { ...mat, isActive: true }
      });
    }
  }
  console.log('✅ Master Materials seeded');

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
      imageUrl:
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&auto=format&fit=crop&q=80'
      ],
      description:
        'A meticulously crafted boxy silhouette made from 100% premium heavy-weight cotton. Designed for durability and comfort.',
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
      imageUrl:
        'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&auto=format&fit=crop&q=80'
      ],
      description:
        'Limited collaboration graphic tee featuring hand-drawn abstract artwork on premium cotton canvas.',
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
      imageUrl:
        'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1200&auto=format&fit=crop&q=80'
      ],
      description:
        'An elevated everyday essential with a relaxed oversized fit. Constructed from heavyweight 280gsm cotton.',
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
      imageUrl:
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&auto=format&fit=crop&q=80'
      ],
      description:
        'Architectural precision meets deep indigo dye. A structured silhouette in our signature heavy-weight fabrication.',
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
    { name: 'MATERIAL STUDY', description: 'Pembahasan jenis kain katun bersertifikat' },
    { name: 'ARCHIVE', description: 'Koleksi arsip dan rilisan terdahulu' },
    { name: 'LOOKBOOK', description: 'Eksplorasi gaya dan visual campaign' },
    { name: 'COMMUNITY', description: 'Kisah orang-orang di balik dan di sekitar brand' }
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
      excerpt:
        'Dalam dunia pakaian esensial, pencarian akan material yang sempurna seringkali terasa seperti mitos. Bagi kami di RIO COLLECTION, ini adalah sebuah obsesi.',
      category: 'MATERIAL STUDY',
      imageUrl:
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&auto=format&fit=crop&q=80',
      pullQuote:
        'Bukan tentang menciptakan sesuatu yang baru, melainkan menyempurnakan sesuatu yang mendasar.',
      content: [
        'Dalam dunia pakaian esensial, pencarian akan material yang sempurna seringkali terasa seperti mitos. Bagi kami di RIO COLLECTION, ini adalah sebuah obsesi.',
        'T-shirt yang baik harus terasa seperti ekstensi dari penggunanya. Ia tidak boleh terlalu ringan, namun harus mempertahankan strukturnya setelah puluhan kali dicucian.',
        'Kami menemukan jawabannya pada katun dengan berat 240gsm. Berat yang tidak lazim untuk iklim tropis, namun krusial untuk menciptakan siluet yang kaku dan maskulin.',
        'Konstruksi kerah menjadi area fokus berikutnya. Rib tebal yang dijahit ganda tidak hanya menjamin bentuk kerah dari peregangan seiring waktu, tetapi juga memberikan aksen visual yang tegas.'
      ],
      contentHtml: `<h2>Memahami Esensi Material Heavyweight</h2>
<p>Dalam dunia pakaian esensial, pencarian akan material yang sempurna seringkali terasa seperti mitos. Bagi kami di <strong>RIO COLLECTION</strong>, ini adalah sebuah obsesi berkelanjutan untuk menemukan titik seimbang antara daya tahan, struktur, dan kenyamanan sehari-hari.</p>
<p>T-shirt yang baik harus terasa seperti ekstensi dari penggunanya. Ia tidak boleh terlalu ringan hingga jatuh meliuk tanpa bentuk, namun harus mempertahankan strukturnya secara konsisten bahkan setelah puluhan kali proses pencucian.</p>

<blockquote>Bukan tentang menciptakan sesuatu yang baru dari nol, melainkan menyempurnakan sesuatu yang sangat mendasar hingga mencapai taraf presisi tertinggi.</blockquote>

<h2>Bobot Kain 240 GSM & Struktur Siluet Boxy</h2>
<p>Kami menemukan jawabannya pada benang <strong>100% Cotton Heavyweight 240 GSM</strong>. Berat yang tidak lazim untuk iklim tropis, namun sangat krusial untuk menciptakan potongan <em>boxy fit</em> yang kaku, rapi, dan memberikan bentuk tubuh yang tegas.</p>

<h3>Keunggulan Utama Benang 240 GSM:</h3>
<ul>
  <li><strong>Siluet Tetap Struktur:</strong> Tidak mudah kusut atau melempai saat dipakai beraktivitas.</li>
  <li><strong>Daya Serap Maksimal:</strong> Tetap adem dan menyerap keringat dengan baik berkat serat katun alami tanpa campuran sintetis.</li>
  <li><strong>Kerah Tidak Mudah Mulur:</strong> Rib kerah tebal 2.5cm dengan jahitan ganda (double-needle stitch) yang tahan lama.</li>
</ul>

<h2>Kesimpulan</h2>
<p>Perjalanan menemukan material ini membuktikan bahwa kualitas sejati terletak pada detail-detail kecil yang dirasakan langsung oleh pemakainya setiap hari.</p>`
    },
    {
      date: '28 September 2024',
      slug: 'melihat-di-balik-layar',
      title: 'Melihat di Balik Layar: Arsitektur Sebuah Koleksi',
      author: 'RIO COLLECTION Editorial Team',
      excerpt:
        'Eksplorasi material mentah dan siluet brutalist dalam proses perancangan Archive Series.',
      category: 'PROSES KREATIF',
      imageUrl:
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
      pullQuote: 'Setiap karya lahir dari detail-detail kecil yang tidak terlihat.',
      content: [
        'Setiap koleksi dimulai dari keheningan. Bukan keheningan yang kosong, tetapi keheningan yang penuh dengan kemungkinan.',
        'Archive Series lahir dari eksperimen panjang dengan konstruksi garmen yang tidak konvensional.',
        'Hasilnya adalah koleksi yang berbicara melalui detail-detail kecil: kelim yang dikerjakan dengan tangan dan label yang dijahit presisi.'
      ],
      contentHtml: `<h2>Pendekatan Arsitektural dalam Rancang Busana</h2>
<p>Setiap koleksi dimulai dari keheningan studio. Bukan keheningan yang kosong, tetapi keheningan yang penuh dengan eksperimen visual dan eksplorasi garis desain.</p>
<p><strong>Archive Series</strong> lahir dari eksplorasi panjang dengan konstruksi garmen yang terinspirasi dari arsitektur brutalist: bentuk geometris yang tegas, potongan bahu <em>drop-shoulder</em> yang rileks, serta pemotongan kain tanpa sisa berlebih.</p>

<blockquote>Setiap karya hebat selalu lahir dari akumulasi detail-detail kecil yang sepintas tidak terlihat oleh mata awam.</blockquote>

<h2>Proses Prototipe & Uji Ketahanan</h2>
<p>Sebelum rilis resmi, setiap karya melewati 5 tahap <em>sample prototype testing</em>:</p>
<ol>
  <li><strong>Pattern Drafting:</strong> Menentukan proporsi rasio panjang badan dan lebar dada.</li>
  <li><strong>Dyeing Test:</strong> Memastikan ketahanan pigmen warna reaktif agar tidak luntur.</li>
  <li><strong>Fit Test:</strong> Diuji pakai pada berbagai bentuk postur tubuh untuk memastikan kenyamanan bergerak.</li>
</ol>`
    },
    {
      date: '05 November 2024',
      slug: 'seni-merawat-heavyweight-cotton',
      title: 'Seni Merawat Heavyweight Cotton Agar Tahan Bertahun-tahun',
      author: 'CREATIVE DIRECTION',
      excerpt:
        'Panduan praktis merawat kaos katun tebal agar warna tetap pekat dan serat kain tidak cepat rusak.',
      category: 'PROCESS',
      imageUrl:
        'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=1200&auto=format&fit=crop&q=80',
      pullQuote: 'Pakaian berkualitas layak mendapatkan perawatan yang baik.',
      content: [
        'Investasi pada kaos berkualitas tinggi perlu diimbangi dengan cara perawatan yang benar.',
        'Cuci dengan air dingin dan balikkan posisi baju sebelum dimasukkan ke dalam mesin pencuci.',
        'Hindari penggunaan pemutih keras dan jemur di tempat teduh agar serat katun tetap lembut.'
      ],
      contentHtml: `<h2>Panduan Perawatan Kaos Katun Premium</h2>
<p>Investasi pada kaos katun berbobot tebal (heavyweight) perlu diimbangi dengan metode perawatan yang tepat. Dengan perawatan yang baik, kaos favorit Anda dapat bertahan hingga bertahun-tahun tanpa kehilangan bentuk maupun warna aslinya.</p>

<h2>3 Langkah Mudah Pencucian:</h2>
<ul>
  <li><strong>Balikkan Kaos (Inside Out):</strong> Selalu balikkan kaos sehingga bagian luar berada di dalam sebelum dicuci untuk melindungi permukaan kain dan sablonan.</li>
  <li><strong>Gunakan Air Dingin:</strong> Suhu air dingin mencegah penyusutan serat katun (shrinkage) dan menjaga kepekatan warna hitam atau putih.</li>
  <li><strong>Jemur Angin (Air Dry):</strong> Hindari pemakaian mesin pengering panas berlebih. Cukup gantung di tempat teduh terhindar dari paparan matahari langsung.</li>
</ul>`
    },
    {
      date: '15 Agustus 2023',
      slug: 'menyusuri-arsip-edisi-001',
      title: 'Menyusuri Arsip: Perjalanan Edisi 001',
      author: 'RIO COLLECTION Archive',
      excerpt:
        'Kilas balik pada desain perdana kami yang mendasari prinsip desain siluet kaku dan material heavyweight pada setiap produk RIO COLLECTION.',
      category: 'ARCHIVE',
      imageUrl:
        'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1200&auto=format&fit=crop&q=80',
      pullQuote:
        'Sebuah desain klasik tidak pernah usang, ia hanya menunggu untuk dipelajari kembali.',
      content: [
        'Setiap brand memiliki titik awal. Bagi kami, Edisi 001 bukan hanya sekadar koleksi pertama, melainkan manifesto fisik dari apa yang kami yakini tentang pakaian esensial.',
        'Siluet yang sedikit terlalu besar (oversized), potongan bahu yang menurun (drop shoulder), dan tentu saja, material katun 240gsm yang saat itu jarang ditemui.',
        'Melihat kembali arsip Edisi 001 mengingatkan kami pada komitmen awal: menciptakan pakaian yang tidak hanya dipakai, tetapi dihidupi.'
      ],
      contentHtml: `<h2>Awal Mula Sebuah Prinsip Desain</h2>
<p>Setiap brand memiliki titik awal. Bagi kami, <strong>Edisi 001</strong> bukan hanya sekadar koleksi pertama, melainkan manifesto fisik dari apa yang kami yakini tentang pakaian esensial.</p>
<p>Saat merancang Edisi 001, fokus kami adalah pada struktur. Siluet yang sedikit terlalu besar (<em>oversized</em>), potongan bahu yang menurun (<em>drop shoulder</em>), dan tentu saja, material katun <strong>240gsm</strong> yang saat itu jarang ditemui di pasaran lokal.</p>

<blockquote>Sebuah desain klasik tidak pernah usang, ia hanya menunggu untuk dipelajari kembali dan disempurnakan.</blockquote>

<h2>Menganalisis Kembali Siluet 001</h2>
<p>Melihat kembali arsip Edisi 001 mengingatkan kami pada komitmen awal: menciptakan pakaian yang tidak hanya dipakai, tetapi dihidupi. Berikut elemen kunci dari edisi pertama ini yang terus kami bawa:</p>
<ul>
  <li><strong>Ketegasan Kerah:</strong> Penggunaan rib tebal yang menjaga bentuk kerah tetap utuh.</li>
  <li><strong>Volume Badan:</strong> Rasio lebar dada terhadap panjang badan yang memberikan ilusi bentuk kotak (boxy).</li>
  <li><strong>Durabilitas:</strong> Pemilihan benang jahit yang lebih kuat untuk menopang berat material katun.</li>
</ul>

<h2>Sebuah Referensi Abadi</h2>
<p>Kini, <strong>Edisi 001</strong> bersemayam di ruang arsip kami, tidak lagi diproduksi namun terus menjadi acuan setiap kali kami merancang koleksi baru.</p>`
    },
    {
      date: '10 November 2023',
      slug: 'visual-campaign-musim-panas',
      title: 'Visual Campaign: Musim Panas di Kota',
      author: 'RIO COLLECTION Editorial Team',
      excerpt:
        'Eksplorasi gaya dan visual campaign untuk koleksi musim panas yang menangkap esensi kehidupan urban.',
      category: 'LOOKBOOK',
      imageUrl:
        'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
      pullQuote:
        'Gaya bukanlah tentang apa yang Anda pakai, melainkan bagaimana Anda menghidupinya.',
      content: [
        'Musim panas di kota selalu membawa energi yang berbeda. Panasnya aspal, hiruk pikuk jalanan, dan dinamika kehidupan urban menjadi inspirasi utama lookbook kali ini.',
        'Kami menangkap momen-momen spontan di sudut-sudut kota, memperlihatkan bagaimana koleksi kami berbaur dengan lanskap beton dan baja.',
        'Fokus utama tetap pada kenyamanan dan daya tahan, memastikan setiap pakaian siap menemani aktivitas padat dari pagi hingga malam.'
      ],
      contentHtml: `<h2>Inspirasi Urban</h2>
<p>Musim panas di kota selalu membawa energi yang berbeda. Panasnya aspal, hiruk pikuk jalanan, dan dinamika kehidupan urban menjadi inspirasi utama lookbook kali ini.</p>
<p>Melalui lensa kamera analog, kami mencoba menangkap momen-momen spontan di sudut-sudut kota, memperlihatkan bagaimana koleksi kami berbaur secara natural dengan lanskap beton dan baja.</p>

<blockquote>Gaya bukanlah tentang apa yang Anda pakai, melainkan bagaimana Anda menghidupinya di tengah dinamika kota.</blockquote>

<h2>Kepraktisan Berpadu Estetika</h2>
<p>Fokus utama <em>campaign</em> ini tetap menonjolkan prinsip utama RIO COLLECTION: <strong>kenyamanan</strong> dan <strong>daya tahan</strong>. Kami ingin memastikan setiap pakaian tidak hanya terlihat bagus di foto, tetapi juga siap menemani aktivitas padat penggunanya dari pagi hingga malam hari.</p>`
    },
    {
      date: '05 Desember 2023',
      slug: 'bertemu-pengrajin-lokal',
      title: 'Cerita Komunitas: Bertemu dengan Pengrajin Lokal',
      author: 'RIO COLLECTION Community',
      excerpt:
        'Kisah di balik layar tentang dedikasi dan keahlian para pengrajin lokal yang mewujudkan setiap desain kami.',
      category: 'COMMUNITY',
      imageUrl:
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&auto=format&fit=crop&q=80',
      pullQuote:
        'Dibalik setiap jahitan presisi, terdapat tangan-tangan terampil yang berdedikasi tinggi.',
      content: [
        'Kualitas sebuah pakaian tidak hanya ditentukan oleh materialnya, tetapi juga oleh tangan-tangan yang menjahitnya.',
        'Bulan ini, kami mengunjungi workshop mitra kami di Bandung untuk melihat langsung dedikasi para pengrajin lokal.',
        'Dari pemotongan pola hingga jahitan akhir, setiap tahap dilakukan dengan ketelitian tingkat tinggi.'
      ],
      contentHtml: `<h2>Pahlawan di Balik Layar</h2>
<p>Kualitas sebuah pakaian tidak hanya ditentukan oleh seberapa bagus materialnya, tetapi juga oleh seberapa terampil tangan-tangan yang merakitnya. Bagi kami, para pengrajin adalah pahlawan tanpa tanda jasa.</p>
<p>Bulan ini, kami menghabiskan waktu mengunjungi <em>workshop</em> mitra kami di Bandung untuk melihat langsung dan mendokumentasikan dedikasi luar biasa dari para pengrajin lokal.</p>

<blockquote>Dibalik setiap jahitan presisi, terdapat tangan-tangan terampil yang berdedikasi tinggi terhadap profesinya.</blockquote>

<h2>Dedikasi pada Presisi</h2>
<p>Dari pemotongan pola yang teliti, proses penjahitan kerah yang rumit, hingga tahap inspeksi akhir, setiap langkah dikerjakan dengan standar kualitas yang ketat. Keahlian pengrajin lokal adalah fondasi terpenting yang memungkinkan visi desain kami terwujud.</p>`
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

  // 8. Product–Journal relationships
  const seededProduct = await prisma.product.findUnique({
    where: { slug: 'heavy-weight-boxy-tee' }
  });
  const seededJournal = await prisma.journal.findUnique({
    where: { slug: 'pencarian-katun-sempurna' }
  });
  if (seededProduct && seededJournal) {
    await prisma.productJournal.upsert({
      where: {
        productId_journalId: { productId: seededProduct.id, journalId: seededJournal.id }
      },
      update: {},
      create: { productId: seededProduct.id, journalId: seededJournal.id }
    });
  }
  console.log('✅ Product-journal relationships seeded');

  // 9. Testimonies
  const testimonies = [
    {
      alt: 'Customer WhatsApp Chat Screenshot 1',
      imageUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
      status: 'ACTIVE'
    },
    {
      alt: 'Customer WhatsApp Chat Screenshot 2',
      imageUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
      status: 'ACTIVE'
    },
    {
      alt: 'Customer WhatsApp Chat Screenshot 3',
      imageUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80',
      status: 'ACTIVE'
    }
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
        {
          bankName: 'Bank BCA',
          accountNumber: '1234567890',
          accountOwner: 'RIO COLLECTION',
          isActive: true,
          sortOrder: 1
        },
        {
          bankName: 'Bank Mandiri',
          accountNumber: '0987654321',
          accountOwner: 'RIO COLLECTION',
          isActive: true,
          sortOrder: 2
        }
      ]
    });
  }
  console.log('✅ Master Banks & Store Banks seeded');

  // 11. Store Settings (Homepage CMS, Archive CMS, About CMS)
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
      instagramUrl: 'https://instagram.com/riocollection.id',
      tiktokUrl: 'https://tiktok.com/@riocollection.id',
      contactEmail: 'hello@riocollection.id',

      // ── Homepage CMS ──
      heroTitle: 'ARCHIVAL ESSENTIALS',
      heroSubtitle:
        'Refined heavyweight cotton silhouettes crafted for modern character and longevity.',
      heroLayout: '2-grid',
      heroSlides: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
          alt: 'Heavy-Weight Boxy Tee — Hitam'
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
          alt: 'Graphic Edition 01 — Putih'
        }
      ],
      heroLeftImage:
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      heroCenterImage:
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
      heroRightImage:
        'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
      heroCtaText: 'Jelajahi Koleksi',
      heroCtaLink: '/catalogue',
      homeFeaturedTitle: 'Rilisan Pilihan',
      homeViewAllLabel: 'Lihat Semua Koleksi',
      homeManifestoTitle: 'Mendefinisikan Ulang Esensi Kualitas & Estetika.',
      homeManifestoText:
        'Setiap karya pakaian dari RIO COLLECTION lahir dari kombinasi riset bahan katun berbobot tinggi (240-280 GSM), siluet kaku modern, serta detail jahitan presisi. Kami menghadirkan pakaian esensial tahan lama yang berkarakter.',
      homeManifestoImage:
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
      homeBannerText: 'Temukan rilisan edisi terbatas dan koleksi esensial RIO COLLECTION.',
      homeBannerButton: 'Jelajahi Katalog Lengkap',

      // ── Archive CMS ──
      archiveHeaderSub:
        'Desain masa lalu dan koleksi arsip rilisan terdahulu yang kami lestarikan sebagai jejak perjalanan kreatif brand.',
      archiveQuoteTitle: 'Merekam jejak perjalanan estetika dan eksperimen material kami.',
      archiveQuoteText:
        'Setiap siluet yang telah habis tidak pernah benar-benar hilang, melainkan menjadi bagian dari sejarah dan fondasi karya kami berikutnya. Arsip adalah bukti bahwa kualitas tidak mengenal waktu.',

      // ── About CMS ──
      aboutHeroImage:
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
      aboutHeading: 'Independen. Archival. Uncompromising.',
      aboutParagraph1:
        'RIO COLLECTION berdiri sebagai studio independen yang berfokus pada eksplorasi pakaian katun berkonstruksi kaku dan bernilai arsip. Kami percaya bahwa sebuah kaos bisa menjadi lebih dari sekadar pakaian—ia adalah pernyataan karakter.',
      aboutParagraph2:
        'Kami percaya bahwa pakaian esensial tidak harus polos tanpa karakter. Melalui pemilihan kain berkualitas tinggi, potong jahitan yang presisi, serta kuantitas rilisan yang terbatas, setiap produk dirancang untuk tahan lama dan menjadi bagian dari koleksi arsip pribadi pemakainya.',
      aboutValuesTitle: 'Prinsip & Nilai Kami',
      aboutValues: [
        {
          title: 'Slow & Conscious Design',
          description:
            'Memilih kualitas bahan dan kerapian konstruksi dibanding produksi cepat masal. Setiap desain melewati riset material dan uji prototipe sebelum diproduksi.'
        },
        {
          title: 'Archival Cotton Silhouette',
          description:
            'Mengembangkan katun berbobot 240-280 GSM yang mempertahankan struktur kaku siluet. Setiap kaos dirancang agar semakin nyaman seiring pemakaian tanpa kehilangan bentuk.'
        },
        {
          title: 'Limited Batch Quantity',
          description:
            'Setiap rilisan dibuat dalam kuantitas terbatas untuk menjaga eksklusivitas karya dan memastikan setiap pembeli mendapatkan produk yang benar-benar istimewa.'
        }
      ],
      aboutQuote:
        'Bukan tentang menciptakan sesuatu yang baru, melainkan menyempurnakan sesuatu yang mendasar.',
      aboutQuoteText: 'RIO COLLECTION Editorial & Design Team',
      aboutStudioImage:
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&auto=format&fit=crop&q=80',

      // ── WhatsApp Templates ──
      waTemplatePending:
        'Halo {name}, terima kasih telah memesan di RIO COLLECTION! 🎉\n\nOrder #{orderNumber} senilai Rp{total} sedang menunggu pembayaran.\n\nSilakan transfer ke rekening berikut:\n{bankDetails}\n\nKonfirmasi pembayaran dengan mengirim bukti transfer.',
      waTemplatePayment:
        'Halo {name}, pembayaran untuk Order #{orderNumber} sudah kami terima dan dikonfirmasi ✅\n\nPesanan Anda sedang kami proses untuk pengiriman. Kami akan mengirimkan nomor resi setelah paket dikirim.',
      waTemplateShipping:
        'Halo {name}, kabar baik! 📦\n\nOrder #{orderNumber} sudah dikirim via {courier}.\nNomor Resi: {trackingNumber}\n\nSilakan lacak pengiriman Anda. Terima kasih telah berbelanja di RIO COLLECTION!',
      waTemplateRemind:
        'Halo {name}, ini pengingat bahwa Order #{orderNumber} senilai Rp{total} masih menunggu pembayaran.\n\nJika sudah transfer, mohon kirimkan bukti pembayaran. Jika ada kendala, jangan ragu menghubungi kami.',

      // ── Shipping Defaults ──
      enabledCouriers: 'jne,pos,tiki',
      originCityId: '23',
      originCityName: 'Bandung',
      originProvinceName: 'Jawa Barat'
    }
  });
  console.log('✅ Store Settings seeded (Homepage, Archive, About CMS)');

  // 12. Platform Finance Settings
  await prisma.platformFinanceSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      serverCostMonthly: 300000,
      markupMode: 'NOMINAL',
      markupValue: 0,
      commissionMode: 'PERCENTAGE',
      commissionRate: 20
    }
  });
  console.log('✅ Platform Finance Settings seeded');

  // 13. Backfill commission snapshots for legacy orders
  const legacyPaidOrders = await prisma.order.findMany({
    where: {
      status: { in: ['PAID', 'FULFILLED'] },
      commissionBaseAmount: 0
    },
    include: { items: true }
  });

  for (const order of legacyPaidOrders) {
    const baseAmount = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    await prisma.order.update({
      where: { id: order.id },
      data: {
        commissionModeSnapshot: 'PERCENTAGE',
        commissionRateSnapshot: 20,
        commissionBaseAmount: baseAmount,
        commissionAmount: Math.round((baseAmount * 20) / 100)
      }
    });
  }
  console.log(`✅ Backfilled commission snapshots for ${legacyPaidOrders.length} paid orders`);

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
