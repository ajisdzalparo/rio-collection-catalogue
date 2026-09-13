import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return process.env.NODE_ENV !== 'production';
  return request.headers.get('authorization') === `Bearer ${cronSecret}`;
}

function getJakartaMonthStart(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit'
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  return new Date(Date.UTC(year, month - 1, 1, -7));
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized cron request.' },
      { status: 401 }
    );
  }

  try {
    const currentMonthStart = getJakartaMonthStart(new Date());
    const result = await prisma.$executeRaw`
      DELETE FROM "ActivityLog"
      WHERE "createdAt" < ${currentMonthStart}
        AND ("createdAt" + INTERVAL '7 hours')::date <
          (
            date_trunc('month', "createdAt" + INTERVAL '7 hours')
            + INTERVAL '1 month'
            - INTERVAL '7 days'
          )::date
    `;

    return NextResponse.json({
      success: true,
      deletedCount: result,
      message: 'Activity log lama dibersihkan. Minggu terakhir setiap bulan tetap disimpan.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error running activity log cleanup cron:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal membersihkan activity log.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
