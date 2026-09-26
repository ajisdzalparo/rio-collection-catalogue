import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth/authorization';

const PAID_STATUSES = new Set(['PAID', 'FULFILLED']);

export async function GET(_request: Request, context: RouteContext<'/api/v1/customers/[id]'>) {
  const actor = await getAuthenticatedUser();
  if (!actor) {
    return NextResponse.json({ code: 401, status: 'error', message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const rawId = decodeURIComponent(id);
  const normalizedId = rawId.replace(/\D/g, '');
  const orders = await prisma.order.findMany({
    where: {
      OR: [{ whatsapp: rawId }, { whatsapp: { contains: normalizedId } }]
    },
    include: { items: true },
    orderBy: { createdAt: 'desc' }
  });
  const matchingOrders = orders.filter(
    (order) => order.whatsapp.replace(/\D/g, '') === normalizedId
  );

  if (!matchingOrders.length) {
    return NextResponse.json(
      { code: 404, status: 'error', message: 'Pelanggan tidak ditemukan.' },
      { status: 404 }
    );
  }

  const latest = matchingOrders[0];
  const addresses = Array.from(
    new Set(matchingOrders.map((order) => order.address.trim()).filter(Boolean))
  );
  const totalSpent = matchingOrders
    .filter((order) => PAID_STATUSES.has(order.status))
    .reduce((sum, order) => sum + order.totalPrice, 0);

  return NextResponse.json({
    code: 200,
    status: 'success',
    data: {
      id: latest.whatsapp,
      whatsapp: latest.whatsapp,
      fullName: latest.fullName,
      latestAddress: latest.address,
      addresses,
      totalOrders: matchingOrders.length,
      totalSpent,
      lastOrderDate: latest.createdAt,
      orders: matchingOrders
    }
  });
}
