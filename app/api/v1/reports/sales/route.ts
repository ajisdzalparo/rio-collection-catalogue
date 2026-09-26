import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth/authorization';
import { allocateAmountByWeights, netItemRevenues } from '@/lib/referral';

const DEFAULT_STATUSES = ['PAID', 'FULFILLED'];

function parseDate(value: string, endOfDay = false) {
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`);
  if (Number.isNaN(date.getTime())) throw new Error('Rentang tanggal laporan tidak valid.');
  return date;
}

export async function GET(request: Request) {
  const actor = await getAuthenticatedUser();
  if (!actor) {
    return NextResponse.json({ code: 401, status: 'error', message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = new URL(request.url).searchParams;
    const startDate = params.get('startDate');
    const endDate = params.get('endDate');
    if (!startDate || !endDate) throw new Error('Periode laporan wajib diisi.');

    const start = parseDate(startDate);
    const end = parseDate(endDate, true);
    if (start > end) throw new Error('Tanggal mulai tidak boleh setelah tanggal akhir.');

    const statuses = (params.get('status') || DEFAULT_STATUSES.join(','))
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const selectedProducts = (params.get('product') || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const duration = end.getTime() - start.getTime();
    const previousEnd = new Date(start.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - duration);
    const baseWhere = {
      status: { in: statuses },
      ...(selectedProducts.length
        ? { items: { some: { name: { in: selectedProducts } } } }
        : {})
    };

    const [currentOrders, previousOrders, products, productOptions] = await Promise.all([
      prisma.order.findMany({
        where: { ...baseWhere, createdAt: { gte: start, lte: end } },
        include: { items: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.findMany({
        where: { ...baseWhere, createdAt: { gte: previousStart, lte: previousEnd } },
        include: { items: true }
      }),
      prisma.product.findMany({ select: { id: true, hpp: true } }),
      prisma.orderItem.findMany({
        where: { order: { status: { in: DEFAULT_STATUSES } } },
        distinct: ['name'],
        select: { name: true },
        orderBy: { name: 'asc' }
      })
    ]);
    const hppByProduct = new Map(products.map((product) => [product.id, product.hpp ?? 0]));

    const calculateMetrics = (orders: typeof currentOrders) => {
      const metrics = {
        grossSales: 0,
        customerDiscount: 0,
        revenue: 0,
        totalHpp: 0,
        netProfit: 0,
        cashReward: 0,
        shirtRewardCost: 0,
        profitAfterReferral: 0,
        profitMargin: 0,
        totalQty: 0
      };
      for (const order of orders) {
        const gross = order.items.map((item) => item.price * item.quantity);
        const discounts = allocateAmountByWeights(gross, order.discountAmount);
        const rewards = allocateAmountByWeights(gross, order.referralRewardAmount);
        order.items.forEach((item, index) => {
          if (selectedProducts.length && !selectedProducts.includes(item.name)) return;
          const revenue = gross[index] - discounts[index];
          metrics.grossSales += gross[index];
          metrics.customerDiscount += discounts[index];
          metrics.revenue += revenue;
          metrics.cashReward += rewards[index];
          metrics.totalHpp += (item.productId ? hppByProduct.get(item.productId) ?? 0 : 0) * item.quantity;
          metrics.totalQty += item.quantity;
        });
      }
      metrics.netProfit = metrics.revenue - metrics.totalHpp;
      metrics.profitAfterReferral = metrics.netProfit - metrics.cashReward;
      metrics.profitMargin = metrics.revenue
        ? (metrics.profitAfterReferral / metrics.revenue) * 100
        : 0;
      return metrics;
    };

    const currentMetrics = calculateMetrics(currentOrders);
    const previousMetrics = calculateMetrics(previousOrders);
    const growthOf = (current: number, previous: number) =>
      previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;
    const growth = {
      revenue: growthOf(currentMetrics.revenue, previousMetrics.revenue),
      profit: growthOf(currentMetrics.netProfit, previousMetrics.netProfit),
      qty: growthOf(currentMetrics.totalQty, previousMetrics.totalQty)
    };

    const topProductMap = new Map<string, { name: string; totalQty: number; revenue: number; profit: number }>();
    for (const order of currentOrders) {
      const revenues = netItemRevenues(order.items, order.discountAmount);
      order.items.forEach((item, index) => {
        if (selectedProducts.length && !selectedProducts.includes(item.name)) return;
        const revenue = revenues[index];
        const profit = revenue - (item.productId ? hppByProduct.get(item.productId) ?? 0 : 0) * item.quantity;
        const existing = topProductMap.get(item.name) ?? { name: item.name, totalQty: 0, revenue: 0, profit: 0 };
        existing.totalQty += item.quantity;
        existing.revenue += revenue;
        existing.profit += profit;
        topProductMap.set(item.name, existing);
      });
    }
    const topProducts = Array.from(topProductMap.values())
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 5);

    const chartDataPoints = [];
    for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      const dayStart = new Date(cursor);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(cursor);
      dayEnd.setHours(23, 59, 59, 999);
      const previousDayStart = new Date(dayStart.getTime() - duration - 1);
      const previousDayEnd = new Date(dayEnd.getTime() - duration - 1);
      const dayMetrics = calculateMetrics(
        currentOrders.filter((order) => order.createdAt >= dayStart && order.createdAt <= dayEnd)
      );
      const previousDayMetrics = calculateMetrics(
        previousOrders.filter(
          (order) => order.createdAt >= previousDayStart && order.createdAt <= previousDayEnd
        )
      );
      chartDataPoints.push({
        label: cursor.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        revenue: dayMetrics.revenue,
        profit: dayMetrics.netProfit,
        prevRevenue: previousDayMetrics.revenue
      });
    }
    const peak = chartDataPoints.reduce(
      (best, point) => (point.revenue > best.revenue ? point : best),
      { label: '-', revenue: 0, profit: 0, prevRevenue: 0 }
    );
    const totalRevenue = chartDataPoints.reduce((sum, point) => sum + point.revenue, 0);
    const chartInsights = {
      peakRevenue: peak.revenue,
      peakLabel: peak.label,
      avgDaily: chartDataPoints.length ? totalRevenue / chartDataPoints.length : 0,
      daysWithSales: chartDataPoints.filter((point) => point.revenue > 0).length,
      totalPoints: chartDataPoints.length
    };

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: {
        currentMetrics,
        growth,
        topProducts,
        chartDataPoints,
        chartInsights,
        availableProducts: productOptions.map((item) => item.name),
        hasPreviousPeriod: previousOrders.length > 0
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        code: 400,
        status: 'error',
        message: error instanceof Error ? error.message : 'Gagal memuat laporan.'
      },
      { status: 400 }
    );
  }
}
