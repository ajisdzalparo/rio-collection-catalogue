import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getReferralManager } from '@/lib/auth/referral-owner';
import { recordActivity } from '@/lib/activity-log';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getReferralManager();
  if (!actor) return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 403 });
  const parsed = z.object({ isActive: z.boolean() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Status kode tidak valid.' }, { status: 400 });
  const { id } = await params;
  const existing = await prisma.referralCode.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ success: false, error: 'Kode tidak ditemukan.' }, { status: 404 });
  const code = await prisma.referralCode.update({ where: { id }, data: { isActive: parsed.data.isActive } });
  await recordActivity({
    actor,
    action: 'STATUS_CHANGE',
    module: 'REFERRALS',
    description: `${code.isActive ? 'Mengaktifkan' : 'Menonaktifkan'} kode referral ${code.code}.`,
    entityType: 'ReferralCode',
    entityId: id,
    request
  });
  return NextResponse.json({ success: true, data: code });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getReferralManager();
  if (!actor) return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.referralCode.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          orders: true,
          gifts: true
        }
      }
    }
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: 'Kode referral tidak ditemukan.' }, { status: 404 });
  }

  if (existing._count.orders > 0 || existing._count.gifts > 0) {
    return NextResponse.json(
      {
        success: false,
        error: 'Kode referral tidak dapat dihapus karena sudah memiliki riwayat transaksi/hadiah. Anda dapat menonaktifkan kode ini.'
      },
      { status: 400 }
    );
  }

  await prisma.referralCode.delete({ where: { id } });

  await recordActivity({
    actor,
    action: 'DELETE',
    module: 'REFERRALS',
    description: `Menghapus kode referral ${existing.code}.`,
    entityType: 'ReferralCode',
    entityId: id,
    request
  });

  return NextResponse.json({ success: true, message: 'Kode referral berhasil dihapus.' });
}
