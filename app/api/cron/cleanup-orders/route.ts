import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { restoreStock } from '@/lib/stock';

export async function GET() {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find all PENDING orders that are stale (> 24 hours)
    const staleOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: twentyFourHoursAgo
        }
      },
      include: {
        items: true
      }
    });

    if (staleOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stale pending orders to clean up',
        updatedCount: 0,
        timestamp: new Date().toISOString()
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Restore stocks for all items in these orders
      for (const order of staleOrders) {
        await restoreStock(order.items, tx);
      }

      // Bulk update the status to EXPIRED
      const updateResult = await tx.order.updateMany({
        where: {
          id: {
            in: staleOrders.map((o) => o.id)
          }
        },
        data: {
          status: 'EXPIRED',
          notes: 'Otomatis Kadaluarsa via Cron Job (Pending > 24 jam)'
        }
      });

      return updateResult;
    });

    return NextResponse.json({
      success: true,
      message: 'Cron job cleanup executed: Stale PENDING orders automatically marked as EXPIRED and stocks restored',
      updatedCount: result.count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error running cleanup cron:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run cleanup cron'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
