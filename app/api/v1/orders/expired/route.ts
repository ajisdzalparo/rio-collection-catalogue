import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { parseAuthCookieUser } from '@/lib/auth/roles';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  return Boolean(parseAuthCookieUser(token));
}

export async function DELETE() {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { code: 401, status: 'error', message: 'Sesi admin tidak valid' },
      { status: 401 }
    );
  }

  try {
    const result = await prisma.order.deleteMany({
      where: { status: 'EXPIRED' }
    });

    return NextResponse.json({
      code: 200,
      status: 'success',
      message: `${result.count} order kedaluwarsa berhasil dihapus`,
      data: { deletedCount: result.count }
    });
  } catch (error) {
    console.error('Error deleting expired orders:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal menghapus order kedaluwarsa' },
      { status: 500 }
    );
  }
}
