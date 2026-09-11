import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatWaNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Legal & Privacy Policy',
  description: 'Informasi hukum dan kebijakan privasi RIO COLLECTION.',
  openGraph: {
    title: 'Legal & Privacy Policy — RIO COLLECTION',
    description: 'Informasi hukum dan kebijakan privasi RIO COLLECTION.',
    images: [{ url: '/ms-icon-310x310.png', width: 310, height: 310, alt: 'RIO COLLECTION Legal' }]
  }
};

export default async function LegalPage() {
  const settings = await prisma.storeSettings
    .findUnique({ where: { id: 'default' } })
    .catch(() => null);

  const storeName = settings?.storeName || 'RIO COLLECTION';
  const contactEmail = settings?.contactEmail;
  const whatsappNumber = settings?.whatsappNumber;

  return (
    <div className="mx-auto max-w-350 px-4 md:px-16 py-12 md:py-20">
      {/* Breadcrumbs */}
      <nav
        className="mb-6 font-hanken text-[11px] uppercase tracking-[0.08em] text-(--cat-on-surface-variant)"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:text-(--cat-on-surface) transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-(--cat-on-surface) font-semibold">Legal</span>
      </nav>

      {/* Header */}
      <header className="mb-12 border-b border-(--cat-stone) pb-8">
        <h1 className="font-eb-garamond text-[36px] md:text-[52px] font-normal leading-tight text-(--cat-on-surface)">
          Legal & Kebijakan Privasi
        </h1>
        <p className="mt-2 font-hanken text-[14px] text-(--cat-on-surface-variant)">
          Terakhir diperbarui: September 2026
        </p>
      </header>

      {/* Content */}
      <div className="max-w-3xl space-y-8 font-hanken text-[14px] md:text-[15px] leading-relaxed text-(--cat-on-surface-variant)">
        <section className="space-y-3">
          <h2 className="font-eb-garamond text-[22px] md:text-[26px] font-normal text-(--cat-on-surface)">
            1. Informasi Umum
          </h2>
          <p>
            {storeName} beroperasi sebagai merek independen yang menyajikan koleksi kaos edisi terbatas. Seluruh materi, desain grafis, logo, fotografi, dan teks yang ditampilkan pada situs web ini merupakan kekayaan intelektual milik {storeName} dan dilindungi oleh undang-undang hak cipta yang berlaku.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-eb-garamond text-[22px] md:text-[26px] font-normal text-(--cat-on-surface)">
            2. Kebijakan Privasi & Perlindungan Data
          </h2>
          <p>
            Kami menghormati dan menjaga privasi pengunjung kami. Informasi pribadi yang Anda berikan saat melakukan pemesanan (seperti nama, alamat pengiriman, nomor WhatsApp, dan bukti transfer pembayaran) hanya digunakan semata-mata untuk:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Memproses dan mengonfirmasi pesanan Anda.</li>
            <li>Mengatur pengiriman paket melalui mitra logistik resmi kami.</li>
            <li>Memberikan pembaruan status resi pengiriman melalui WhatsApp.</li>
          </ul>
          <p>
            Kami menjamin tidak akan pernah menjual, menyewakan, atau menyebarluaskan data pribadi Anda kepada pihak ketiga manapun untuk tujuan komersial.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-eb-garamond text-[22px] md:text-[26px] font-normal text-(--cat-on-surface)">
            3. Hak Cipta Desain & Merek
          </h2>
          <p>
            Penggandaan, pembajakan, modifikasi, atau reproduksi ulang terhadap karya desain grafis atau siluet pakaian {storeName} tanpa izin tertulis dilarang keras secara hukum.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-eb-garamond text-[22px] md:text-[26px] font-normal text-(--cat-on-surface)">
            4. Pertanyaan Hukum
          </h2>
          <p>
            Untuk pertanyaan atau permohonan terkait privasi dan legalitas, silakan hubungi tim kami
            {contactEmail ? (
              <>
                {' '}melalui email di{' '}
                <a href={`mailto:${contactEmail}`} className="text-(--cat-on-surface) underline font-medium">
                  {contactEmail}
                </a>.
              </>
            ) : whatsappNumber ? (
              <>
                {' '}melalui WhatsApp resmi di{' '}
                <a
                  href={`https://wa.me/${formatWaNumber(whatsappNumber)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-(--cat-on-surface) underline font-medium"
                >
                  +{formatWaNumber(whatsappNumber)}
                </a>.
              </>
            ) : (
              <> melalui saluran kontak resmi yang tertera pada katalog {storeName}.</>
            )}
          </p>
        </section>
      </div>
    </div>
  );
}
