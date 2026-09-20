import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth/authorization';
import { getEffectivePermissions } from '@/lib/auth/user-permissions';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user || !(await getEffectivePermissions(user.role))['reports.view']) {
    return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 403 });
  }
  const gifts = await prisma.referralGiftDelivery.findMany({
    select: { id: true, deliveredAt: true, quantity: true, unitCogs: true },
    orderBy: { deliveredAt: 'desc' }
  });
  return NextResponse.json({ success: true, data: gifts });
}
