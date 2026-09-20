import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { calculateReferralAmounts, normalizeReferralCode, type BenefitMode } from '@/lib/referral';
import { referralCodeValueSchema } from '@/lib/referral-schema';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';

const quoteSchema = z.object({
  code: referralCodeValueSchema,
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1).max(99)
  })).min(1).max(30)
});

export async function POST(request: Request) {
  const rate = checkRateLimit('referral-quote', getClientIp(request), { windowMs: 60_000, maxRequests: 30 });
  if (!rate.allowed) {
    return NextResponse.json({ success: false, error: 'Terlalu banyak percobaan.' }, { status: 429 });
  }
  const parsed = quoteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Kode atau keranjang tidak valid.' }, { status: 400 });
  }
  const code = normalizeReferralCode(parsed.data.code);
  const [referral, products] = await Promise.all([
    prisma.referralCode.findUnique({ where: { code } }),
    prisma.product.findMany({
      where: { id: { in: parsed.data.items.map((item) => item.productId) }, deletedAt: null },
      select: { id: true, price: true }
    })
  ]);
  if (!referral?.isActive) {
    return NextResponse.json({ success: false, error: 'Kode referral tidak aktif atau tidak ditemukan.' }, { status: 404 });
  }
  const prices = new Map(products.map((product) => [product.id, product.price]));
  if (parsed.data.items.some((item) => !prices.has(item.productId))) {
    return NextResponse.json({ success: false, error: 'Produk dalam keranjang berubah. Muat ulang checkout.' }, { status: 409 });
  }
  const amounts = calculateReferralAmounts(
    parsed.data.items.map((item) => ({ price: prices.get(item.productId) ?? 0, quantity: item.quantity })),
    referral.discountMode as BenefitMode,
    referral.discountValue
  );
  return NextResponse.json({
    success: true,
    data: {
      code,
      subtotal: amounts.subtotal,
      discountAmount: amounts.discountAmount,
      netSubtotal: amounts.netSubtotal
    }
  });
}
