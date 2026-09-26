import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getReferralViewer } from '@/lib/auth/referral-owner';
import { giftEntitlement, isReferralRewardEligible, isReferralSale } from '@/lib/referral';

export async function GET(request: Request) {
  const actor = await getReferralViewer();
  if (!actor) return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 403 });
  const partners = await prisma.referralPartner.findMany({
    include: {
      codes: {
        include: {
          orders: {
            select: {
              id: true, orderNumber: true, fullName: true, customerId: true, email: true,
              status: true, createdAt: true, discountAmount: true, referralRewardAmount: true,
              referralPayoutId: true, items: { select: { price: true, quantity: true } }
            },
            orderBy: { createdAt: 'desc' }
          },
          gifts: { select: { id: true, quantity: true, productName: true, size: true, deliveredAt: true, note: true } }
        },
        orderBy: { createdAt: 'desc' }
      },
      payouts: { select: { id: true, amount: true, paidAt: true, note: true, orders: { select: { id: true, orderNumber: true } } }, orderBy: { paidAt: 'desc' } }
    },
    orderBy: { createdAt: 'desc' }
  });
  const data = partners.map((partner) => {
    const codes = partner.codes.map((code) => {
      const successful = code.orders.filter((order) => isReferralSale(order.status));
      const fulfilled = code.orders.filter((order) => isReferralRewardEligible(order.status));
      const unitsSold = successful.reduce((sum, order) => sum + order.items.reduce((count, item) => count + item.quantity, 0), 0);
      const fulfilledUnits = fulfilled.reduce((sum, order) => sum + order.items.reduce((count, item) => count + item.quantity, 0), 0);
      const deliveredGifts = code.gifts.reduce((sum, gift) => sum + gift.quantity, 0);
      const giftCount = code.giftEveryUnits ? giftEntitlement(fulfilledUnits, code.giftEveryUnits, deliveredGifts) : { earned: 0, available: 0 };
      return {
        id: code.id, code: code.code, isActive: code.isActive, discountMode: code.discountMode,
        discountValue: code.discountValue, rewardKind: code.rewardKind, rewardMode: code.rewardMode,
        rewardValue: code.rewardValue, giftEveryUnits: code.giftEveryUnits,
        orderCount: code.orders.length, paidOrders: successful.length,
        customerIds: [...new Set(successful.map((order) => order.customerId ?? order.email ?? order.id))],
        unitsSold,
        netRevenue: successful.reduce((sum, order) => sum + order.items.reduce((gross, item) => gross + item.price * item.quantity, 0) - order.discountAmount, 0),
        estimatedCash: successful.reduce((sum, order) => sum + order.referralRewardAmount, 0),
        payableCash: fulfilled.filter((order) => !order.referralPayoutId).reduce((sum, order) => sum + order.referralRewardAmount, 0),
        paidCash: fulfilled.filter((order) => order.referralPayoutId).reduce((sum, order) => sum + order.referralRewardAmount, 0),
        earnedGifts: giftCount.earned, deliveredGifts, availableGifts: giftCount.available,
        gifts: code.gifts,
        orders: code.orders.map((order) => ({
          ...order,
          units: order.items.reduce((sum, item) => sum + item.quantity, 0),
          netProducts: order.items.reduce((sum, item) => sum + item.price * item.quantity, 0) - order.discountAmount,
          items: undefined
        }))
      };
    });
    return {
      id: partner.id, name: partner.name, whatsapp: partner.whatsapp, notes: partner.notes,
      createdAt: partner.createdAt,
      paidOrders: codes.reduce((sum, code) => sum + code.paidOrders, 0),
      customerCount: new Set(codes.flatMap((code) => code.customerIds)).size,
      unitsSold: codes.reduce((sum, code) => sum + code.unitsSold, 0),
      netRevenue: codes.reduce((sum, code) => sum + code.netRevenue, 0),
      codes, payouts: partner.payouts
    };
  });
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim().toLowerCase() || '';
  const pageParam = searchParams.get('page');
  const pageSizeParam = searchParams.get('pageSize');
  const page = Math.max(1, Number.parseInt(pageParam || '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(pageSizeParam || '10', 10) || 10));
  const paginated = Boolean(pageParam || pageSizeParam);
  const filtered = data.filter(
    (partner) =>
      !search ||
      partner.name.toLowerCase().includes(search) ||
      partner.whatsapp?.toLowerCase().includes(search) ||
      partner.notes?.toLowerCase().includes(search)
  );
  const pageData = paginated ? filtered.slice((page - 1) * pageSize, page * pageSize) : filtered;
  const summary = {
    totalPartners: data.length,
    totalPaidOrders: data.reduce((sum, partner) => sum + partner.paidOrders, 0),
    totalUnitsSold: data.reduce((sum, partner) => sum + partner.unitsSold, 0),
    totalNetRevenue: data.reduce((sum, partner) => sum + partner.netRevenue, 0)
  };

  return NextResponse.json({
    success: true,
    data: pageData,
    options: data.map((partner) => ({ id: partner.id, name: partner.name })),
    summary,
    meta: {
      page: paginated ? page : 1,
      pageSize: paginated ? pageSize : filtered.length,
      total: filtered.length,
      totalPages: paginated ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1
    }
  });
}
