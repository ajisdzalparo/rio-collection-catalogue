import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrderNotificationSnapshot } from '@/lib/order-notifications.server';

import { parseAuthCookieUser } from '@/lib/auth/roles';

const sinceSchema = z.coerce.date();

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get('auth_token')?.value;
  const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');
  const token = rawCookie || authHeader;
  const user = parseAuthCookieUser(token);

  if (!user) {
    return NextResponse.json(
      { code: 401, status: 'error', message: 'Sesi tidak valid atau belum login' },
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
