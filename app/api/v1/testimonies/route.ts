import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || searchParams.get('q')?.trim() || '';
    const pageParam = searchParams.get('page');
    const statuses = (searchParams.get('status') || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const pageSizeParam = searchParams.get('pageSize') || searchParams.get('limit');

    const where: Prisma.TestimonyWhereInput = {};

    if (search) {
      where.alt = { contains: search, mode: 'insensitive' };
    }
    if (statuses.length === 1) where.status = statuses[0];
    if (statuses.length > 1) where.status = { in: statuses };

    const isPaginated = Boolean(pageParam || pageSizeParam);
    const page = Math.max(1, parseInt(pageParam || '1', 10) || 1);
    const pageSize = Math.max(1, parseInt(pageSizeParam || '10', 10) || 10);
    const skip = isPaginated ? (page - 1) * pageSize : undefined;
    const take = isPaginated ? pageSize : undefined;

    const [total, testimonies, totalAll, active, hidden] = await Promise.all([
      prisma.testimony.count({ where }),
      prisma.testimony.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.testimony.count(),
      prisma.testimony.count({ where: { status: 'ACTIVE' } }),
      prisma.testimony.count({ where: { status: 'HIDDEN' } })
    ]);

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: testimonies,
      meta: {
        page: isPaginated ? page : 1,
        pageSize: isPaginated ? pageSize : total,
        total,
        totalPages: isPaginated ? Math.max(1, Math.ceil(total / pageSize)) : 1,
        stats: { total: totalAll, active, hidden }
      }
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
