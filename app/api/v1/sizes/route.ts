import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sizes = await prisma.size.findMany({
      where: { deletedAt: null }
    });
    return NextResponse.json({
      code: 200,
      status: 'success',
      data: sizes
    });
  } catch (error) {
    console.error('Error fetching sizes:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to fetch sizes' },
      { status: 500 }
    );
  }
}
