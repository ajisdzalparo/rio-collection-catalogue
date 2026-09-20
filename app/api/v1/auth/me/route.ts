import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/authorization';
import { getEffectivePermissions } from '@/lib/auth/user-permissions';

export async function GET() {
  try {
    const userData = await getAuthenticatedUser();
    if (!userData) {
      return NextResponse.json(
        { code: 401, status: 'error', message: 'Belum login' },
        { status: 401 }
      );
    }

    const permissions = await getEffectivePermissions(userData.role);
    return NextResponse.json({
      code: 200,
      status: 'success',
      data: { ...userData, permissions }
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json(
      { code: 401, status: 'error', message: 'Sesi tidak valid' },
      { status: 401 }
    );
  }
}
