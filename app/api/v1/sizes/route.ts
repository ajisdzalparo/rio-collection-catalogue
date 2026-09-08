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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { size } = body;
    if (!size || typeof size !== 'string') {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Size name is required' },
        { status: 400 }
      );
    }
    const formattedSize = size.trim().toUpperCase();
    const existing = await prisma.size.findFirst({
      where: { size: formattedSize }
    });
    if (existing) {
      if (existing.deletedAt) {
        const restored = await prisma.size.update({
          where: { id: existing.id },
          data: { deletedAt: null, isActive: true }
        });
        return NextResponse.json({ code: 200, status: 'success', data: restored });
      }
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Size already exists' },
        { status: 400 }
      );
    }
    const newSize = await prisma.size.create({
      data: {
        size: formattedSize,
        isActive: true
      }
    });
    return NextResponse.json({ code: 201, status: 'success', data: newSize }, { status: 201 });
  } catch (error) {
    console.error('Error creating size:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to create size' },
      { status: 500 }
    );
  }
}
