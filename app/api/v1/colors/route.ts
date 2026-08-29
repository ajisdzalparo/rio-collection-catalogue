import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const colors = await prisma.color.findMany({
      where: { deletedAt: null }
    });
    return NextResponse.json({
      code: 200,
      status: 'success',
      data: colors
    });
  } catch (error) {
    console.error('Error fetching colors:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to fetch colors' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, hex } = body;

    const newColor = await prisma.color.create({
      data: {
        name,
        hex: hex || '#000000'
      }
    });

    return NextResponse.json({
      code: 201,
      status: 'success',
      data: newColor
    });
  } catch (error) {
    console.error('Error creating color:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to create color' },
      { status: 500 }
    );
  }
}
