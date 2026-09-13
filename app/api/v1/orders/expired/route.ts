import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function isAuthenticated() {
  const token = (await cookies()).get('auth_token')?.value;
  if (!token) return false;
  try {
    JSON.parse(token);
    return true;
  } catch {
    return false;
  }
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
