'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { getProducts, submitOrder } from '@/lib/api';
import type { Product } from '@/types/catalogue.types';

export default function OrderPage() {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    whatsapp: '',
    address: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getProducts().then((prods) => {
      if (prods.length > 0) setProduct(prods[0]);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setIsSubmitting(true);
    try {
      const res = await submitOrder({
        fullName: formData.fullName,
        whatsapp: formData.whatsapp,
        address: formData.address,
        items: [{ productId: product.id, size: 'M', quantity: 1 }],
      });
      const orderNum = res?.data?.orderNumber || 'RC-8802';
      router.push(`/order/confirmation/${orderNum}`);
    } catch {
      router.push('/order/confirmation/RC-8802');
    }
  };

  const isValid = formData.fullName && formData.whatsapp && formData.address;

  return (
    <>
      {/* Header */}
      <section className="mx-auto max-w-350 px-4 md:px-16 pt-8 md:pt-12 pb-6">
        <nav
          className="mb-4 font-hanken text-[11px] uppercase tracking-[0.08em] text-(--cat-on-surface-variant)"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-(--cat-on-surface) transition-colors">Home</Link>
          <span className="mx-2">&gt;</span>
          <Link href="/catalogue" className="hover:text-(--cat-on-surface) transition-colors">Catalogue</Link>
          <span className="mx-2">&gt;</span>
          <span className="text-(--cat-on-surface) font-semibold">Checkout</span>
        </nav>

        <h1 className="font-eb-garamond text-[32px] md:text-[48px] font-normal leading-tight text-(--cat-on-surface)">
          Lengkapi Data Pesanan
        </h1>
      </section>

      {/* Order Form */}
      <section className="mx-auto max-w-350 px-4 md:px-16 pb-16 md:pb-24">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
            {/* Left: Order Summary */}
            <div className="md:col-span-5">
              <div className="border border-(--cat-stone) p-6">
                <h2 className="font-eb-garamond text-[20px] font-normal text-(--cat-on-surface) mb-6">
                  Ringkasan Pesanan
                </h2>

                {/* Product */}
                <div className="flex gap-4 pb-6 border-b border-(--cat-stone)">
                  <div className="relative w-20 h-24 shrink-0 overflow-hidden bg-(--cat-surface-container-low)">
                    {product?.imageUrl && (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-hanken text-[15px] font-medium text-(--cat-on-surface)">
                      {product?.name || 'Heavy-Weight Boxy Tee'}
                    </h3>
                    <p className="mt-0.5 font-hanken text-[13px] text-(--cat-on-surface-variant)">
                      M / {product?.color || 'Hitam'}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-hanken text-[13px] text-(--cat-on-surface-variant)">
                        Qty: 1
                      </span>
                      <span className="font-hanken text-[16px] font-medium text-(--cat-on-surface) tabular-nums">
                        {product ? formatPrice(product.price) : 'Rp 450.000'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Totals */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-hanken text-[14px] text-(--cat-on-surface-variant)">Subtotal</span>
                    <span className="font-hanken text-[14px] text-(--cat-on-surface) tabular-nums">
                      {product ? formatPrice(product.price) : 'Rp 450.000'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-hanken text-[14px] text-(--cat-on-surface-variant)">Estimasi Pengiriman</span>
                    <span className="font-hanken text-[11px] uppercase tracking-[0.08em] text-(--cat-on-surface-variant)">Dihitung Selanjutnya</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-(--cat-stone) flex items-center justify-between">
                  <span className="font-hanken text-[16px] font-semibold text-(--cat-on-surface)">Total</span>
                  <span className="font-hanken text-[18px] font-semibold text-(--cat-on-surface) tabular-nums">
                    {product ? formatPrice(product.price) : 'Rp 450.000'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Customer Form */}
            <div className="md:col-span-7 space-y-8">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mb-3"
                >
                  Nama Lengkap
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-transparent border-0 border-b border-(--cat-stone) pb-2 font-hanken text-[16px] text-(--cat-on-surface) outline-none focus:border-(--cat-charcoal) transition-colors placeholder:text-(--cat-outline-variant)"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label
                  htmlFor="whatsapp"
                  className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mb-3"
                >
                  Nomor WhatsApp
                </label>
                <input
                  id="whatsapp"
                  type="tel"
                  required
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full bg-transparent border-0 border-b border-(--cat-stone) pb-2 font-hanken text-[16px] text-(--cat-on-surface) outline-none focus:border-(--cat-charcoal) transition-colors placeholder:text-(--cat-outline-variant)"
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              {/* Address */}
              <div>
                <label
                  htmlFor="address"
                  className="block font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mb-3"
                >
                  Alamat Pengiriman
                </label>
                <textarea
                  id="address"
                  required
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-transparent border-0 border-b border-(--cat-stone) pb-2 font-hanken text-[16px] text-(--cat-on-surface) outline-none focus:border-(--cat-charcoal) transition-colors resize-none placeholder:text-(--cat-outline-variant)"
                  placeholder="Alamat lengkap termasuk kode pos"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className={cn(
                  'inline-flex items-center justify-center gap-2 px-12 py-3.5 font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] transition-opacity duration-150',
                  isValid && !isSubmitting
                    ? 'bg-(--cat-charcoal) text-white hover:opacity-85 cursor-pointer'
                    : 'bg-(--cat-secondary-container) text-(--cat-on-secondary-container) cursor-not-allowed'
                )}
              >
                {isSubmitting ? 'Memproses...' : 'Lanjutkan ke Tinjauan'}
                {!isSubmitting && <ArrowRight size={14} strokeWidth={2} />}
              </button>
            </div>
          </div>
        </form>
      </section>
    </>
  );
}
