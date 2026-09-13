import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { getActivityLogViewer } from '@/lib/auth/authorization';
import { prisma } from '@/lib/prisma';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(10),
  search: z.string().trim().max(100).optional(),
  action: z.string().trim().max(40).optional(),
  module: z.string().trim().max(40).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

function parseJakartaDate(value: string, endOfDay = false): Date {
  return new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}+07:00`);
}

export async function GET(request: Request) {
  const viewer = await getActivityLogViewer();
  if (!viewer) {
    return NextResponse.json(
      { code: 403, status: 'error', message: 'Activity Log hanya dapat diakses Super Admin dan Owner.' },
      { status: 403 }
    );
  }

  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { code: 400, status: 'error', message: 'Filter activity log tidak valid.' },
      { status: 400 }
    );
  }

  const { page, pageSize, search, action, module, startDate, endDate } = parsed.data;
  const where: Prisma.ActivityLogWhereInput = {
    ...(action && action !== 'ALL' ? { action } : {}),
    ...(module && module !== 'ALL' ? { module } : {}),
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate ? { gte: parseJakartaDate(startDate) } : {}),
            ...(endDate ? { lte: parseJakartaDate(endDate, true) } : {})
          }
        }
      : {}),
    ...(search
      ? {
          OR: [
            { actorName: { contains: search, mode: 'insensitive' } },
            { actorEmail: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { entityId: { contains: search, mode: 'insensitive' } }
          ]
        }
      : {})
  };

  try {
    const jakartaNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const today = jakartaNow.toISOString().slice(0, 10);
    const [items, total, todayCount, actors] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.activityLog.count({ where }),
      prisma.activityLog.count({
        where: {
          createdAt: {
            gte: parseJakartaDate(today),
            lte: parseJakartaDate(today, true)
          }
        }
      }),
      prisma.activityLog.findMany({ where, distinct: ['actorEmail'], select: { actorEmail: true } })
    ]);

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: {
        items,
        summary: { total, today: todayCount, uniqueActors: actors.length },
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal memuat activity log.' },
      { status: 500 }
    );
  }
}
