import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth/authorization';

const PAID_STATUSES = new Set(['PAID', 'FULFILLED']);

export async function GET(request: Request) {
  const actor = await getAuthenticatedUser();
  if (!actor) {
    return NextResponse.json({ code: 401, status: 'error', message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim().toLowerCase() || '';
  const types = new Set(
    (searchParams.get('type') || '')
      .split(',')
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean)
  );
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(searchParams.get('pageSize') || '10', 10) || 10)
  );

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      whatsapp: true,
      fullName: true,
      address: true,
      status: true,
      totalPrice: true,
      createdAt: true
    }
  });

  const customerMap = new Map<
    string,
    {
      id: string;
      whatsapp: string;
      fullName: string;
      latestAddress: string;
      addresses: Set<string>;
      totalOrders: number;
      totalSpent: number;
      lastOrderDate: Date;
    }
  >();

  for (const order of orders) {
    const whatsapp = order.whatsapp.trim();
    const existing = customerMap.get(whatsapp);
    if (!existing) {
      customerMap.set(whatsapp, {
        id: whatsapp,
        whatsapp,
        fullName: order.fullName,
        latestAddress: order.address,
        addresses: new Set(order.address.trim() ? [order.address.trim()] : []),
        totalOrders: 1,
        totalSpent: PAID_STATUSES.has(order.status) ? order.totalPrice : 0,
        lastOrderDate: order.createdAt
      });
      continue;
    }

    existing.totalOrders += 1;
    if (PAID_STATUSES.has(order.status)) existing.totalSpent += order.totalPrice;
    if (order.address.trim()) existing.addresses.add(order.address.trim());
  }

  const customers = Array.from(customerMap.values())
    .map((customer) => ({
      ...customer,
      addresses: Array.from(customer.addresses),
      lastOrderDate: customer.lastOrderDate.toISOString(),
      orders: []
    }))
    .filter((customer) => {
      const matchesSearch =
        !search ||
        customer.fullName.toLowerCase().includes(search) ||
        customer.whatsapp.toLowerCase().includes(search) ||
        customer.addresses.some((address) => address.toLowerCase().includes(search));
      if (!matchesSearch || types.size === 0) return matchesSearch;

      return (
        (types.has('REPEAT') && customer.totalOrders > 1) ||
        (types.has('NEW') && customer.totalOrders === 1) ||
        (types.has('VIP') && customer.totalSpent >= 500_000)
      );
    })
    .sort((a, b) => b.totalOrders - a.totalOrders);

  const total = customers.length;
  const data = customers.slice((page - 1) * pageSize, page * pageSize);

  return NextResponse.json({
    code: 200,
    status: 'success',
    data,
    meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
  });
}
