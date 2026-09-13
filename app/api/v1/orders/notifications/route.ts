import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrderNotificationSnapshot } from '@/lib/order-notifications.server';

const sinceSchema = z.coerce.date();

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json(
      { code: 401, status: 'error', message: 'Belum login' },
      { status: 401 }
    );
  }

  try {
    JSON.parse(token);
  } catch {
    return NextResponse.json(
      { code: 401, status: 'error', message: 'Sesi tidak valid' },
      { status: 401 }
    );
  }

  const sinceParam = new URL(request.url).searchParams.get('since');
  const parsedSince = sinceSchema.safeParse(sinceParam);

  if (!parsedSince.success) {
    return NextResponse.json(
      { code: 400, status: 'error', message: 'Waktu notifikasi tidak valid' },
      { status: 400 }
    );
  }

  try {
    const snapshot = await getOrderNotificationSnapshot(parsedSince.data);

    return NextResponse.json(
      {
        code: 200,
        status: 'success',
        data: snapshot
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching order notifications:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal memuat notifikasi pesanan' },
      { status: 500 }
    );
  }
}
