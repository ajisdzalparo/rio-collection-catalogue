import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const testimonies = await prisma.testimony.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({
      code: 200,
      status: 'success',
      data: testimonies
    });
  } catch (error) {
    console.error('Error fetching testimonies:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to fetch testimonies' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { alt, imageUrl } = body;

    const newTestimony = await prisma.testimony.create({
      data: {
        alt: alt || 'Customer WhatsApp Chat Screenshot',
        imageUrl
      }
    });

    return NextResponse.json({
      code: 201,
      status: 'success',
      data: newTestimony
    });
  } catch (error) {
    console.error('Error creating testimony:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to create testimony' },
      { status: 500 }
    );
  }
}
