import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await prisma.order.updateMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: twentyFourHoursAgo
        }
      },
      data: {
        status: 'EXPIRED',
        notes: 'Otomatis Kadaluarsa via Cron Job (Pending > 24 jam)'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Cron job cleanup executed: Stale PENDING orders automatically marked as EXPIRED',
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
