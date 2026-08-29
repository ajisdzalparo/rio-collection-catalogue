import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { code: 401, status: 'error', message: 'Belum login' },
        { status: 401 }
      );
    }

    const userData = JSON.parse(token);
    return NextResponse.json({
      code: 200,
      status: 'success',
      data: userData
    });
  } catch (error) {
    return NextResponse.json(
      { code: 401, status: 'error', message: 'Sesi tidak valid' },
      { status: 401 }
    );
  }
}
