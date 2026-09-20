import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getReferralManager } from '@/lib/auth/referral-owner';
import { partnerSchema } from '@/lib/referral-schema';
import { recordActivity } from '@/lib/activity-log';

export async function POST(request: Request) {
  const actor = await getReferralManager();
  if (!actor) return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 403 });
  const parsed = partnerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Data partner tidak valid.', details: parsed.error.flatten() }, { status: 400 });
  }
  const partner = await prisma.referralPartner.create({ data: parsed.data });
  await recordActivity({ actor, action: 'CREATE', module: 'REFERRALS', description: `Membuat partner referral ${partner.name}.`, entityType: 'ReferralPartner', entityId: partner.id, request });
  return NextResponse.json({ success: true, data: partner }, { status: 201 });
}
