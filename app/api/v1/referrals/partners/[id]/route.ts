import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getReferralManager } from '@/lib/auth/referral-owner';
import { recordActivity } from '@/lib/activity-log';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getReferralManager();
  if (!actor) return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 403 });

  const { id } = await params;
  const partner = await prisma.referralPartner.findUnique({
    where: { id },
    include: {
      codes: {
        select: {
          id: true,
          _count: {
            select: {
              orders: true,
              gifts: true
            }
          }
        }
      },
      _count: {
        select: {
          payouts: true,
          gifts: true
        }
      }
    }
  });

  if (!partner) {
    return NextResponse.json({ success: false, error: 'Partner referral tidak ditemukan.' }, { status: 404 });
  }

  const hasOrders = partner.codes.some((c) => c._count.orders > 0);
  const hasGifts = partner.codes.some((c) => c._count.gifts > 0) || partner._count.gifts > 0;
  const hasPayouts = partner._count.payouts > 0;

  if (hasOrders || hasGifts || hasPayouts) {
    return NextResponse.json(
      {
        success: false,
        error: 'Partner tidak dapat dihapus karena sudah memiliki riwayat transaksi, komisi, atau hadiah.'
      },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.referralCode.deleteMany({ where: { partnerId: id } }),
    prisma.referralPartner.delete({ where: { id } })
  ]);

  await recordActivity({
    actor,
    action: 'DELETE',
    module: 'REFERRALS',
    description: `Menghapus partner referral ${partner.name}.`,
    entityType: 'ReferralPartner',
    entityId: id,
    request
  });

  return NextResponse.json({ success: true, message: 'Partner referral berhasil dihapus.' });
}
