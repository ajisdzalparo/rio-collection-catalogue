import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/authorization';

export async function GET() {
  try {
    const userData = await getAuthenticatedUser();
    if (!userData) {
      return NextResponse.json(
        { code: 401, status: 'error', message: 'Belum login' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: userData
    });
  } catch {
    return NextResponse.json(
      { code: 401, status: 'error', message: 'Sesi tidak valid' },
      { status: 401 }
    );
  }
}
