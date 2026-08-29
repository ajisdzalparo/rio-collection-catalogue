import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const archives = await prisma.archive.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({
      code: 200,
      status: 'success',
      data: archives
    });
  } catch (error) {
    console.error('Error fetching archives:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to fetch archives' },
      { status: 500 }
    );
  }
}
