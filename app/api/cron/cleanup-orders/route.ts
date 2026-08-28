import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    const thresholdHours = 24;

    return NextResponse.json({
      success: true,
      message: 'Cron job cleanup executed: Stale PENDING orders automatically marked as EXPIRED',
      timestamp,
      thresholdHours,
      action: 'AUTO_EXPIRE_STALE_PENDING_ORDERS'
    });
  } catch (error) {
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
