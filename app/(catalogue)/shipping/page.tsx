import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'Informasi dan kebijakan pengiriman pesanan RIO COLLECTION.',
  openGraph: {
    title: 'Shipping Policy — RIO COLLECTION',
    description: 'Informasi dan kebijakan pengiriman pesanan RIO COLLECTION.',
    images: [{ url: '/ms-icon-310x310.png', width: 310, height: 310, alt: 'RIO COLLECTION Shipping' }]
  }
};

export default async function ShippingPage() {
  const settings = await prisma.storeSettings
    .findUnique({ where: { id: 'default' } })
    .catch(() => null);

  const storeName = settings?.storeName || 'RIO COLLECTION';
  const originCity = settings?.originCityName || 'Bandung';
  const couriers = (settings?.enabledCouriers || 'jne,pos,tiki,sicepat,jnt')
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .join(', ');

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
        <span className="text-(--cat-on-surface) font-semibold">Shipping</span>
      </nav>

      {/* Header */}
      <header className="mb-12 border-b border-(--cat-stone) pb-8">
        <h1 className="font-eb-garamond text-[36px] md:text-[52px] font-normal leading-tight text-(--cat-on-surface)">
          Kebijakan Pengiriman
        </h1>
        <p className="mt-2 font-hanken text-[14px] text-(--cat-on-surface-variant)">
          Informasi Logistik & Pengantaran Paket {storeName}
        </p>
      </header>

      {/* Content */}
      <div className="max-w-3xl space-y-8 font-hanken text-[14px] md:text-[15px] leading-relaxed text-(--cat-on-surface-variant)">
        <section className="space-y-3">
          <h2 className="font-eb-garamond text-[22px] md:text-[26px] font-normal text-(--cat-on-surface)">
            1. Asal Pengiriman & Mitra Ekspedisi
          </h2>
          <p>
            Seluruh pesanan dikemas dan dikirimkan langsung dari studio kami di <strong>{originCity}</strong>. Kami bekerja sama dengan jaringan ekspedisi terpercaya di Indonesia: <strong>{couriers}</strong>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-eb-garamond text-[22px] md:text-[26px] font-normal text-(--cat-on-surface)">
            2. Waktu Pemrosesan & Pengiriman
          </h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Produk Ready Stock:</strong> Diproses dan diserahkan ke kurir dalam waktu 1–2 hari kerja setelah verifikasi pembayaran berhasil.
            </li>
            <li>
              <strong>Produk Pre-Order (PO):</strong> Diproses sesuai dengan estimasi tanggal rilis yang tertera pada deskripsi produk katalog.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-eb-garamond text-[22px] md:text-[26px] font-normal text-(--cat-on-surface)">
            3. Pelacakan Pesanan & Nomor Resi
          </h2>
          <p>
            Setelah paket Anda diserahkan kepada pihak ekspedisi, nomor resi pengiriman akan langsung dikirimkan kepada Anda melalui pesan konfirmasi WhatsApp dan dapat dipantau di halaman status pesanan.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-eb-garamond text-[22px] md:text-[26px] font-normal text-(--cat-on-surface)">
            4. Ongkos Kirim
          </h2>
          <p>
            {settings?.flatShippingRate ? (
              <>Tarif ongkos kirim standar yang berlaku saat ini adalah <strong>{formatPrice(settings.flatShippingRate)}</strong> per transaksi flat ke wilayah jangkauan kami.</>
            ) : (
              <>Biaya pengiriman dihitung secara otomatis berdasarkan kota/kecamatan tujuan dan bobot pesanan Anda saat melakukan proses checkout.</>
            )}
          </p>
        </section>
      </div>
    </div>
  );
}
