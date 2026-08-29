import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const totalOrders = await prisma.order.count();
    const paidOrdersCount = await prisma.order.count({
      where: { status: 'PAID' }
    });
    const pendingOrdersCount = await prisma.order.count({
      where: { status: 'PENDING' }
    });

    const revenueResult = await prisma.order.aggregate({
      _sum: {
        totalPrice: true
      },
      where: {
        status: { in: ['PAID', 'FULFILLED'] }
      }
    });

    const outOfStockProducts = await prisma.product.count({
      where: { status: 'SOLD_OUT' }
    });

    const totalRevenue = revenueResult._sum.totalPrice || 0;

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: {
        totalOrders,
        paidOrders: paidOrdersCount,
        pendingOrders: pendingOrdersCount,
        totalRevenue,
        outOfStockProducts,
        monthlyGrowth: 12.5
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
