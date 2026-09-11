import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Syarat dan ketentuan pembelian di RIO COLLECTION.',
  openGraph: {
    title: 'Terms of Service — RIO COLLECTION',
    description: 'Syarat dan ketentuan pembelian di RIO COLLECTION.',
    images: [{ url: '/ms-icon-310x310.png', width: 310, height: 310, alt: 'RIO COLLECTION Terms' }]
  }
};

export default async function TermsPage() {
  const settings = await prisma.storeSettings
    .findUnique({ where: { id: 'default' } })
    .catch(() => null);

  const storeName = settings?.storeName || 'RIO COLLECTION';

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
        <span className="text-(--cat-on-surface) font-semibold">Terms</span>
      </nav>

      {/* Header */}
      <header className="mb-12 border-b border-(--cat-stone) pb-8">
        <h1 className="font-eb-garamond text-[36px] md:text-[52px] font-normal leading-tight text-(--cat-on-surface)">
          Syarat & Ketentuan
        </h1>
        <p className="mt-2 font-hanken text-[14px] text-(--cat-on-surface-variant)">
          Ketentuan Pembelian & Transaksi Katalog {storeName}
        </p>
      </header>

      {/* Content */}
      <div className="max-w-3xl space-y-8 font-hanken text-[14px] md:text-[15px] leading-relaxed text-(--cat-on-surface-variant)">
        <section className="space-y-3">
          <h2 className="font-eb-garamond text-[22px] md:text-[26px] font-normal text-(--cat-on-surface)">
            1. Sistem Rilis & Pemesanan Terbatas
          </h2>
          <p>
            Setiap edisi kaos yang dirilis oleh {storeName} diproduksi dalam jumlah terbatas (*limited batch*). Pesanan yang telah dikirimkan melalui sistem web bersifat *pre-confirmation* hingga bukti pembayaran transfer bank diverifikasi oleh admin.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-eb-garamond text-[22px] md:text-[26px] font-normal text-(--cat-on-surface)">
            2. Pembayaran & Batas Waktu
          </h2>
          <p>
            Pembayaran dilakukan melalui transfer rekening bank resmi yang tertera pada invoice pesanan. Pembeli diharapkan mengunggah atau mengirimkan bukti transfer dalam batas waktu yang ditentukan agar stok yang dipesan tidak dilepaskan kembali ke publik.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-eb-garamond text-[22px] md:text-[26px] font-normal text-(--cat-on-surface)">
            3. Kebijakan Penukaran & Pengembalian (*Exchange & Returns*)
          </h2>
          <p>
            Kami selalu melakukan *quality check* ketat sebelum setiap pesanan dikirim. Pengajuan klaim penukaran barang yang cacat produksi wajib menyertakan video unboxing utuh tanpa jeda maksimal 2x24 jam sejak paket diterima menurut tracking ekspedisi.
          </p>
          <p>
            Penukaran karena kesalahan pemilihan ukuran (*size*) bergantung pada ketersediaan stok tersisa pada edisi tersebut.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-eb-garamond text-[22px] md:text-[26px] font-normal text-(--cat-on-surface)">
            4. Perubahan Ketentuan
          </h2>
          <p>
            {storeName} berhak untuk memperbarui atau mengubah syarat dan ketentuan ini sewaktu-waktu tanpa pemberitahuan sebelumnya demi meningkatkan kualitas layanan kami.
          </p>
        </section>
      </div>
    </div>
  );
}
