import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCustomerFromRequest } from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const customer = await getCustomerFromRequest(request);
    if (!customer) {
      return NextResponse.json(
        { code: 401, status: 'error', message: 'Sesi login tidak valid atau telah berakhir.' },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { customerId: customer.id },
          { email: customer.email }
        ]
      },
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: orders
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal memuat daftar pesanan Anda.' },
      { status: 500 }
    );
  }
}
