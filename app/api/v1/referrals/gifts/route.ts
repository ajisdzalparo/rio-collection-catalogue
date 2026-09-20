import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getReferralSettler } from '@/lib/auth/referral-owner';
import { deductStock } from '@/lib/stock';
import { recordActivity } from '@/lib/activity-log';
import { giftEntitlement } from '@/lib/referral';

const giftSchema = z.object({
  codeId: z.string().min(1),
  productId: z.string().min(1),
  size: z.string().min(1).max(30),
  quantity: z.number().int().positive().max(100),
  note: z.string().trim().max(1000).optional()
});

export async function POST(request: Request) {
  const actor = await getReferralSettler();
  if (!actor) return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 403 });
  const parsed = giftSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Data hadiah tidak valid.' }, { status: 400 });
  const { codeId, productId, size, quantity, note } = parsed.data;
  try {
    const gift = await prisma.$transaction(async (tx) => {
      const [code, product, orders, delivered] = await Promise.all([
        tx.referralCode.findUnique({ where: { id: codeId } }),
        tx.product.findUnique({ where: { id: productId }, include: { variants: true } }),
        tx.order.findMany({ where: { referralCodeId: codeId, status: 'FULFILLED' }, select: { items: { select: { quantity: true } } } }),
        tx.referralGiftDelivery.aggregate({ where: { codeId }, _sum: { quantity: true } })
      ]);
      if (!code || code.rewardKind !== 'SHIRT' || !code.giftEveryUnits) throw new Error('Kode hadiah tidak valid.');
      const units = orders.reduce((sum, order) => sum + order.items.reduce((count, item) => count + item.quantity, 0), 0);
      const available = giftEntitlement(units, code.giftEveryUnits, delivered._sum.quantity ?? 0).available;
      if (quantity > available) throw new Error(`Hak kaos tersedia: ${Math.max(available, 0)}.`);
      if (!product || product.deletedAt || product.stockMode !== 'QUANTITY') throw new Error('Pilih produk dengan stok yang dikelola.');
      if (!product.variants.some((variant) => variant.size === size && variant.inStock && variant.stock >= quantity)) {
        throw new Error('Stok ukuran kaos hadiah tidak mencukupi.');
      }
      await deductStock([{ productId, size, quantity }], tx);
      return tx.referralGiftDelivery.create({
        data: { codeId, partnerId: code.partnerId, productId, productName: product.name, size, quantity, unitCogs: product.hpp, note }
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    await recordActivity({ actor, action: 'CREATE', module: 'REFERRALS', description: `Menyerahkan ${quantity} kaos hadiah referral ${gift.productName} (${size}).`, entityType: 'ReferralGiftDelivery', entityId: gift.id, request });
    return NextResponse.json({ success: true, data: gift }, { status: 201 });
  } catch (error) {
    const conflict = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
    return NextResponse.json({ success: false, error: conflict ? 'Stok atau hak hadiah berubah. Muat ulang dan coba lagi.' : error instanceof Error ? error.message : 'Gagal mencatat hadiah.' }, { status: 409 });
  }
}
