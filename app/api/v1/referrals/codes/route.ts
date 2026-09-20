import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getReferralManager } from '@/lib/auth/referral-owner';
import { createReferralCodeSchema } from '@/lib/referral-schema';
import { normalizeReferralCode } from '@/lib/referral';
import { recordActivity } from '@/lib/activity-log';

export async function POST(request: Request) {
  const actor = await getReferralManager();
  if (!actor) return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 403 });
  const parsed = createReferralCodeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Pengaturan kode tidak valid.', details: parsed.error.flatten() }, { status: 400 });
  }
  const partner = await prisma.referralPartner.findUnique({ where: { id: parsed.data.partnerId } });
  if (!partner) return NextResponse.json({ success: false, error: 'Partner tidak ditemukan.' }, { status: 404 });
  try {
    const input = parsed.data;
    const code = await prisma.referralCode.create({
      data: {
        partnerId: input.partnerId,
        code: normalizeReferralCode(input.code),
        discountMode: input.discountMode,
        discountValue: input.discountValue,
        rewardKind: input.rewardKind,
        rewardMode: input.rewardKind === 'CASH' ? input.rewardMode : null,
        rewardValue: input.rewardKind === 'CASH' ? input.rewardValue : null,
        giftEveryUnits: input.rewardKind === 'SHIRT' ? input.giftEveryUnits : null
      }
    });
    await recordActivity({ actor, action: 'CREATE', module: 'REFERRALS', description: `Membuat kode referral ${code.code} untuk ${partner.name}.`, entityType: 'ReferralCode', entityId: code.id, request });
    return NextResponse.json({ success: true, data: code }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'Kode sudah digunakan.' }, { status: 409 });
    }
    throw error;
  }
}
