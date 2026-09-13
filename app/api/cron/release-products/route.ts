import { NextResponse } from 'next/server';
import { syncDueProductReleases } from '@/lib/product-release';

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return process.env.NODE_ENV !== 'production';
  return request.headers.get('authorization') === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized cron request.' },
      { status: 401 }
    );
  }

  try {
    const updatedCount = await syncDueProductReleases();
    return NextResponse.json({
      success: true,
      updatedCount,
      message: 'Scheduled product releases synchronized.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error running product release cron:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memproses release produk.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
