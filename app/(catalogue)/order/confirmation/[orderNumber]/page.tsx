import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatPrice, formatWaNumber } from '@/lib/utils';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { getOrderStatusLabel, getOrderStatusMessage } from '@/lib/order-status';
import { OrderStatusBadge } from '@/components/catalogue/order-status-badge';

export const metadata: Metadata = {
  title: 'Permintaan Pesanan Diterima',
  description:
    'Your purchase request has been received. We will contact you via WhatsApp for confirmation.',
  openGraph: {
    title: 'Permintaan Pesanan Diterima — RIO COLLECTION',
    description: 'Your purchase request has been received.',
    images: [
      {
        url: '/ms-icon-310x310.png',
        width: 310,
        height: 310,
        alt: 'RIO COLLECTION Order Confirmation',
      },
    ],
  },
};

interface OrderConfirmationProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function OrderConfirmationPage({ params }: OrderConfirmationProps) {
  await connection();
  const { orderNumber } = await params;
  const [order, settings, storeBanks] = await Promise.all([
    prisma.order
      .findUnique({
        where: { orderNumber },
        include: {items: true }
      }),
    prisma.storeSettings
      .findUnique({ where: {id: 'default' } })
      .catch(() => null),
    prisma.storeBank
      .findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }] })
      .catch(() => [])
  ]);
  if (!order) notFound();
  const statusLabel = getOrderStatusLabel(order.status);
  const paymentPending = ['CONFIRMED', 'WAITING_PAYMENT'].includes(order.status);

  const whatsappNumber = (settings?.whatsappNumber || '').replace(/[^0-9]/g, '');

  return (
    <section className="mx-auto max-w-200 px-4 md:px-8 py-16 md:py-24">
      {/* Success Icon */}
      <div className="text-center">
        <CheckCircle2 size={48} strokeWidth={1} className="mx-auto text-(--cat-on-surface) mb-6" />

        {/* Status Badge */}
        <div className="mb-6">
          <OrderStatusBadge status={order.status} size="lg" />
        </div>

        {/* Title */}
        <h1 className="font-eb-garamond text-[32px] md:text-[48px] font-normal leading-tight text-(--cat-on-surface)">
          {order.status === 'PENDING' ? 'Permintaan Pesanan Diterima' : statusLabel}
        </h1>
      </div>

      {/* Order Details */}
      <div className="mt-10 pt-8 border-t border-(--cat-stone)">
        {order.discountAmount > 0 && <p className="mb-5 font-hanken text-[13px] text-green-700">
          Diskon referral {order.referralCodeSnapshot}: −{formatPrice(order.discountAmount)}
        </p>}
        <div className="grid grid-cols-2 gap-y-8 gap-x-8">
          <div>
            <p className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mb-1">
              Order Number
            </p>
            <p className="font-hanken text-[18px] font-medium text-(--cat-on-surface)">
              #{orderNumber}
            </p>
          </div>
          <div>
            <p className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mb-1">
              Product
            </p>
            <p className="font-hanken text-[16px] font-medium text-(--cat-on-surface)">
               {order?.items.map((item) => `${item.name} (${item.size}) x${item.quantity}`).join(', ') || '—'}
            </p>
          </div>
          <div>
            <p className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mb-1">
              Customer
            </p>
            <p className="font-hanken text-[16px] font-medium text-(--cat-on-surface)">
              {order?.fullName || '—'}
            </p>
          </div>
          <div>
            <p className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mb-1">
              Total
            </p>
            <p className="font-hanken text-[20px] font-semibold text-(--cat-on-surface) tabular-nums">
              {order?.totalPrice ? formatPrice(order.totalPrice) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Bank Payment Section */}
      {paymentPending && storeBanks.length > 0 && (
        <div className="mt-10 pt-8 border-t border-(--cat-stone)">
          <p className="font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] text-(--cat-on-surface-variant) mb-4">
            Rekening Bank Pembayaran (Transfer Manual)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {storeBanks.map((bank) => (
              <div key={bank.id} className="p-4 border border-(--cat-stone) bg-(--cat-surface-container-low)">
                <p className="font-hanken text-[12px] font-bold text-(--cat-on-surface) uppercase trackingwide">
                  {bank.bankName}
                </p>
                <p className="font-mono text-[18px] font-semibold text-(--cat-on-surface) my-1 select-all">
                  {bank.accountNumber}
                </p>
                <p className="font-hanken text-[12px] text-(--cat-on-surface-variant)">
                  a/n <span className="font-medium text-(--cat-on-surface)">{bank.accountOwner}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="mt-10 pt-8 border-t border-(--cat-stone) text-center">
        <p className="font-hanken text-[15px] leading-relaxed text-(--cat-on-surface-variant) max-w-lg mx-auto">
          {getOrderStatusMessage(order.status)}
        </p>
        {order.courierName && <p className="mt-4">Pengiriman: {order.courierName}</p>}
        {order.trackingNumber && <p className="mt-2">Nomor resi: {order.trackingNumber}</p>}

        {/* WhatsApp CTA — number from CMS store settings */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={`https://wa.me/${formatWaNumber(whatsappNumber)}?text=${encodeURIComponent(`Halo, saya ingin konfirmasi pesanan #${orderNumber}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-(--cat-charcoal) text-white font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] hover:opacity-85 transition-opacity duration-150">
            <MessageCircle size={16} strokeWidth={1.5} />
            Chat via WhatsApp
          </a>
          <Link
            href="/catalogue"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-(--cat-charcoal) text-(--cat-charcoal) font-hanken text-[11px] font-semibold uppercase tracking-[0.08em] hover:bg-(--cat-surface-container) transition-colors duration-150">
            Kembali ke Katalog
          </Link>
        </div>
      </div>
    </section>
  );
}
