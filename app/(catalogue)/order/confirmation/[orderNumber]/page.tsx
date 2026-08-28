import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { getProducts } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Permintaan Pesanan Diterima',
  description: 'Your purchase request has been received. We will contact you via WhatsApp for confirmation.',
};

interface OrderConfirmationProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function OrderConfirmationPage({ params }: OrderConfirmationProps) {
  const { orderNumber } = await params;
  const products = await getProducts();
  const product = products[0];

  return (
    <section className="mx-auto max-w-[800px] px-4 md:px-8 py-16 md:py-24">
      {/* Success Icon */}
      <div className="text-center">
        <CheckCircle2
          size={48}
          strokeWidth={1}
          className="mx-auto text-[var(--cat-on-surface)] mb-6"
        />

        {/* Status Badge */}
        <div className="inline-block border border-[var(--cat-stone)] px-6 py-2 mb-6">
          <p className="font-[family-name:var(--font-hanken)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cat-on-surface-variant)]">
            Menunggu
          </p>
          <p className="font-[family-name:var(--font-hanken)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cat-on-surface-variant)]">
            Konfirmasi
          </p>
        </div>

        {/* Title */}
        <h1 className="font-[family-name:var(--font-eb-garamond)] text-[32px] md:text-[48px] font-normal leading-tight text-[var(--cat-on-surface)]">
          Permintaan Pesanan Diterima
        </h1>
      </div>

      {/* Order Details */}
      <div className="mt-10 pt-8 border-t border-[var(--cat-stone)]">
        <div className="grid grid-cols-2 gap-y-8 gap-x-8">
          <div>
            <p className="font-[family-name:var(--font-hanken)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cat-on-surface-variant)] mb-1">
              Order Number
            </p>
            <p className="font-[family-name:var(--font-hanken)] text-[18px] font-medium text-[var(--cat-on-surface)]">
              #{orderNumber}
            </p>
          </div>
          <div>
            <p className="font-[family-name:var(--font-hanken)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cat-on-surface-variant)] mb-1">
              Product
            </p>
            <p className="font-[family-name:var(--font-hanken)] text-[16px] font-medium text-[var(--cat-on-surface)]">
              {product?.name || 'Heavy-Weight Boxy Tee'} (M)
            </p>
          </div>
          <div>
            <p className="font-[family-name:var(--font-hanken)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cat-on-surface-variant)] mb-1">
              Customer
            </p>
            <p className="font-[family-name:var(--font-hanken)] text-[16px] font-medium text-[var(--cat-on-surface)]">
              Guest User
            </p>
          </div>
          <div>
            <p className="font-[family-name:var(--font-hanken)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cat-on-surface-variant)] mb-1">
              Total
            </p>
            <p className="font-[family-name:var(--font-hanken)] text-[20px] font-semibold text-[var(--cat-on-surface)] tabular-nums">
              {product ? formatPrice(product.price) : 'Rp 450.000'}
            </p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="mt-10 pt-8 border-t border-[var(--cat-stone)] text-center">
        <p className="font-[family-name:var(--font-hanken)] text-[15px] leading-relaxed text-[var(--cat-on-surface-variant)] max-w-lg mx-auto">
          Permintaan pesanan Anda telah kami terima. Tim kami akan segera menghubungi Anda melalui WhatsApp untuk konfirmasi ketersediaan stok dan instruksi pembayaran manual.
        </p>

        {/* WhatsApp CTA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={`https://wa.me/6281234567890?text=${encodeURIComponent(`Halo, saya ingin konfirmasi pesanan #${orderNumber}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--cat-charcoal)] text-white font-[family-name:var(--font-hanken)] text-[11px] font-semibold uppercase tracking-[0.08em] hover:opacity-85 transition-opacity duration-150"
          >
            <MessageCircle size={16} strokeWidth={1.5} />
            Chat via WhatsApp
          </a>
          <Link
            href="/catalogue"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-[var(--cat-charcoal)] text-[var(--cat-charcoal)] font-[family-name:var(--font-hanken)] text-[11px] font-semibold uppercase tracking-[0.08em] hover:bg-[var(--cat-surface-container)] transition-colors duration-150"
          >
            Kembali ke Katalog
          </Link>
        </div>
      </div>
    </section>
  );
}
