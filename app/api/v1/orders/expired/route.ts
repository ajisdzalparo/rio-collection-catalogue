import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeUserWithPermission } from '@/lib/auth/authorization';

export async function DELETE() {
  const auth = await authorizeUserWithPermission('orders.process');
  if (!auth.success) return auth.response;


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
