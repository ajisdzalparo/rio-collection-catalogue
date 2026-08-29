import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDateParam) {
      const start = new Date(startDateParam);
      if (!isNaN(start.getTime())) dateFilter.gte = start;
    }
    if (endDateParam) {
      const end = new Date(endDateParam);
      if (!isNaN(end.getTime())) dateFilter.lte = end;
    }

    const orderWhere = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const totalOrders = await prisma.order.count({
      where: orderWhere
    });
    const paidOrdersCount = await prisma.order.count({
      where: { ...orderWhere, status: 'PAID' }
    });
    const pendingOrdersCount = await prisma.order.count({
      where: { ...orderWhere, status: 'PENDING' }
    });

    const revenueResult = await prisma.order.aggregate({
      _sum: {
        totalPrice: true
      },
      where: {
        ...orderWhere,
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
