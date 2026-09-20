import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getReferralSettler } from '@/lib/auth/referral-owner';
import { recordActivity } from '@/lib/activity-log';

const payoutSchema = z.object({
  partnerId: z.string().min(1),
  orderIds: z.array(z.string().min(1)).min(1).max(100),
  note: z.string().trim().max(1000).optional()
});

export async function POST(request: Request) {
  const actor = await getReferralSettler();
  if (!actor) return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 403 });
  const parsed = payoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || new Set(parsed.data.orderIds).size !== parsed.data.orderIds.length) {
    return NextResponse.json({ success: false, error: 'Pilihan reward tidak valid.' }, { status: 400 });
  }
  const { partnerId, orderIds, note } = parsed.data;
  try {
    const payout = await prisma.$transaction(async (tx) => {
      const orders = await tx.order.findMany({
        where: { id: { in: orderIds }, status: 'FULFILLED', referralPayoutId: null, referralRewardKind: 'CASH', referralCode: { partnerId } },
        select: { id: true, referralRewardAmount: true }
      });
      if (orders.length !== orderIds.length || orders.some((order) => order.referralRewardAmount <= 0)) {
        throw new Error('Sebagian reward sudah dibayar atau belum memenuhi syarat.');
      }
      const created = await tx.referralPayout.create({
        data: { partnerId, amount: orders.reduce((sum, order) => sum + order.referralRewardAmount, 0), note }
      });
      const updated = await tx.order.updateMany({
        where: { id: { in: orderIds }, status: 'FULFILLED', referralPayoutId: null, referralRewardKind: 'CASH' },
        data: { referralPayoutId: created.id }
      });
      if (updated.count !== orderIds.length) throw new Error('Reward berubah saat pembayaran dicatat. Coba lagi.');
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    await recordActivity({ actor, action: 'CREATE', module: 'REFERRALS', description: `Mencatat pembayaran reward referral Rp${payout.amount} untuk ${orderIds.length} order.`, entityType: 'ReferralPayout', entityId: payout.id, request });
    return NextResponse.json({ success: true, data: payout }, { status: 201 });
  } catch (error) {
    const conflict = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
    return NextResponse.json({ success: false, error: conflict ? 'Data reward berubah. Muat ulang dan coba lagi.' : error instanceof Error ? error.message : 'Gagal mencatat pembayaran.' }, { status: 409 });
  }
}
