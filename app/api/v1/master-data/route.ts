import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth/authorization';

const resourceSchema = z.enum(['categories', 'colors', 'sizes', 'topics', 'banks', 'materials']);

export async function GET(request: Request) {
  const actor = await getAuthenticatedUser();
  if (!actor) {
    return NextResponse.json({ code: 401, status: 'error', message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsedResource = resourceSchema.safeParse(searchParams.get('resource'));
  if (!parsedResource.success) {
    return NextResponse.json(
      { code: 400, status: 'error', message: 'Resource master data tidak valid.' },
      { status: 400 }
    );
  }

  const resource = parsedResource.data;
  const search = searchParams.get('search')?.trim() || '';
  const type = searchParams.get('type')?.trim() || '';
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(searchParams.get('pageSize') || '10', 10) || 10)
  );
  const skip = (page - 1) * pageSize;

  let items: unknown[] = [];
  let total = 0;

  switch (resource) {
    case 'categories': {
      const where = {
        deletedAt: null,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { description: { contains: search, mode: 'insensitive' as const } }
              ]
            }
          : {})
      };
      [total, items] = await Promise.all([
        prisma.category.count({ where }),
        prisma.category.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize })
      ]);
      break;
    }
    case 'colors': {
      const where = {
        deletedAt: null,
        ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {})
      };
      [total, items] = await Promise.all([
        prisma.color.count({ where }),
        prisma.color.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize })
      ]);
      break;
    }
    case 'sizes': {
      const where = {
        deletedAt: null,
        ...(search ? { size: { contains: search, mode: 'insensitive' as const } } : {})
      };
      [total, items] = await Promise.all([
        prisma.size.count({ where }),
        prisma.size.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize })
      ]);
      break;
    }
    case 'topics': {
      const where = {
        deletedAt: null,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { description: { contains: search, mode: 'insensitive' as const } }
              ]
            }
          : {})
      };
      [total, items] = await Promise.all([
        prisma.topic.count({ where }),
        prisma.topic.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize })
      ]);
      break;
    }
    case 'banks': {
      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { code: { contains: search, mode: 'insensitive' as const } }
            ]
          }
        : {};
      [total, items] = await Promise.all([
        prisma.bank.count({ where }),
        prisma.bank.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize })
      ]);
      break;
    }
    case 'materials': {
      const where = {
        ...(type ? { type } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { description: { contains: search, mode: 'insensitive' as const } }
              ]
            }
          : {})
      };
      [total, items] = await Promise.all([
        prisma.materialMaster.count({ where }),
        prisma.materialMaster.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize
        })
      ]);
    }
  }

  return NextResponse.json({
    code: 200,
    status: 'success',
    data: items,
    meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
  });
}
