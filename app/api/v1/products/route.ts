import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeProductAvailability } from '@/lib/product-availability';
import { mapProductRelations } from '@/lib/catalogue-relations';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/auth/authorization';
import { recordActivity } from '@/lib/activity-log';
import { syncDueProductReleases, validateReleaseSchedule } from '@/lib/product-release';

const journalIdsSchema = z.array(z.string().min(1)).max(100).default([]);
const journalSummarySelect = {
  id: true, slug: true, title: true, excerpt: true, category: true, date: true, imageUrl: true
} as const;

import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    await syncDueProductReleases();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || searchParams.get('q')?.trim() || '';
    const categoryParam = searchParams.get('category')?.trim() || '';
    const statusParam = searchParams.get('status')?.trim() || '';
    const stockStateParam = searchParams.get('stockState')?.trim() || '';
    const needsStock = searchParams.get('needsStock') === 'true';
    const includeStats = searchParams.get('includeStats') === 'true';
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize') || searchParams.get('limit');

    const where: Prisma.ProductWhereInput = {
      deletedAt: null
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { color: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (categoryParam) {
      const categories = categoryParam
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      if (categories.length === 1) {
        where.category = categories[0];
      } else if (categories.length > 1) {
        where.category = { in: categories };
      }
    }

    if (statusParam) {
      const statuses = statusParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (statuses.length === 1) {
        where.status = statuses[0];
      } else if (statuses.length > 1) {
        where.status = { in: statuses };
      }
    }

    const stockStates = stockStateParam
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const stockConditions: Prisma.ProductWhereInput[] = [];
    if (stockStates.includes('ALWAYS_AVAILABLE')) {
      stockConditions.push({ stockMode: 'ALWAYS_AVAILABLE' });
    }
    if (stockStates.includes('IN_STOCK')) {
      stockConditions.push({
        OR: [{ stockMode: 'ALWAYS_AVAILABLE' }, { stockMode: 'QUANTITY', stock: { gt: 0 } }]
      });
    }
    if (stockStates.includes('SOLD_OUT')) {
      stockConditions.push({ stockMode: 'QUANTITY', stock: { lte: 0 } });
    }
    if (stockConditions.length) {
      where.AND = [...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []), { OR: stockConditions }];
    }
    if (needsStock) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        { status: 'AVAILABLE', stockMode: 'QUANTITY', stock: { lte: 0 } }
      ];
    }

    const isPaginated = Boolean(pageParam || pageSizeParam);
    const page = Math.max(1, parseInt(pageParam || '1', 10) || 1);
    const pageSize = Math.max(1, parseInt(pageSizeParam || '10', 10) || 10);
    const skip = isPaginated ? (page - 1) * pageSize : undefined;
    const take = isPaginated ? pageSize : undefined;

    const [total, products, stockStats] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take,
        include: {
          variants: {
            select: {
              size: true,
              inStock: true,
              stock: true
            }
          },
          journalLinks: {
            include: { journal: { select: journalSummarySelect } },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      includeStats
        ? Promise.all([
            prisma.product.count({ where: { deletedAt: null } }),
            prisma.product.count({
              where: {
                deletedAt: null,
                OR: [{ stockMode: 'ALWAYS_AVAILABLE' }, { stockMode: 'QUANTITY', stock: { gt: 0 } }]
              }
            }),
            prisma.product.count({
              where: { deletedAt: null, stockMode: 'QUANTITY', stock: { gt: 0, lte: 5 } }
            }),
            prisma.product.count({
              where: { deletedAt: null, stockMode: 'QUANTITY', stock: { lte: 0 } }
            })
          ])
        : null
    ]);

    const mappedProducts = products.map((product) =>
      normalizeProductAvailability(
        mapProductRelations(product as unknown as Parameters<typeof mapProductRelations>[0])
      )
    );

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: mappedProducts,
      meta: {
        page: isPaginated ? page : 1,
        pageSize: isPaginated ? pageSize : total,
        total,
        totalPages: isPaginated ? Math.max(1, Math.ceil(total / pageSize)) : 1,
        ...(stockStats
          ? {
              stats: {
                totalProducts: stockStats[0],
                inStockCount: stockStats[1],
                lowStockCount: stockStats[2],
                soldOutCount: stockStats[3]
              }
            }
          : {})
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getAuthenticatedUser();
    const body = await request.json();
    const {
      name,
      slug,
      category,
      color,
      colorHex,
      colors,
      colorHexes,
      price,
      hpp,
      stock,
      stockMode,
      orderLimitMode,
      maxPurchaseLimit,
      status,
      releaseDate,
      preOrderEstimate,
      imageUrl,
      images,
      description,
      variants,
      edition,
      imageDetails,
      materialsAndCare,
      journalIds
    } = body;
    const parsedJournalIds = journalIdsSchema.safeParse(journalIds);
    if (!parsedJournalIds.success) {
      return NextResponse.json({ message: 'Relasi jurnal tidak valid' }, { status: 400 });
    }

    const normalizedStatus = typeof status === 'string' ? status : 'AVAILABLE';
    const releaseValidation = validateReleaseSchedule(normalizedStatus, releaseDate);
    if (!releaseValidation.valid) {
      return NextResponse.json(
        { code: 400, status: 'error', message: releaseValidation.message },
        { status: 400 }
      );
    }
    if (stockMode !== undefined && stockMode !== 'QUANTITY' && stockMode !== 'ALWAYS_AVAILABLE') {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Mode stok produk tidak valid.' },
        { status: 400 }
      );
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        edition: edition || 'Edition 001',
        category,
        color,
        colorHex: colorHex || '#1A1A1A',
        colors: Array.isArray(colors) && colors.length > 0 ? colors : [color].filter(Boolean),
        colorHexes:
          Array.isArray(colorHexes) && colorHexes.length > 0 ? colorHexes : [colorHex || '#1A1A1A'],
        price: Number(price),
        hpp: hpp === undefined ? null : Number(hpp),
        stock: stock === undefined ? 0 : Number(stock),
        stockMode: stockMode || 'QUANTITY',
        orderLimitMode: orderLimitMode || 'UNLIMITED',
        maxPurchaseLimit: maxPurchaseLimit !== undefined ? Number(maxPurchaseLimit) : 1,
        status: normalizedStatus,
        releaseDate: releaseValidation.date,
        preOrderEstimate:
          preOrderEstimate === undefined
            ? null
            : preOrderEstimate
              ? String(preOrderEstimate).trim()
              : null,
        imageUrl:
          imageUrl ||
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
        images:
          Array.isArray(images) && images.length > 0
            ? images
            : [
                imageUrl ||
                  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'
              ],
        imageDetails: imageDetails || null,
        description: description || '',
        materialsAndCare: materialsAndCare || null,
        variants: {
          createMany: {
            data: variants || [
              { size: 'S', inStock: true, stock: 10 },
              { size: 'M', inStock: true, stock: 10 },
              { size: 'L', inStock: true, stock: 10 },
              { size: 'XL', inStock: true, stock: 10 }
            ]
          }
        },
        journalLinks: {
          createMany: {
            data: parsedJournalIds.data.map((journalId) => ({ journalId })),
            skipDuplicates: true
          }
        }
      },
      include: {
        variants: true,
        journalLinks: { include: { journal: { select: journalSummarySelect } } }
      }
    });
    revalidatePath('/catalogue');
    revalidatePath('/archive');
    revalidatePath(`/products/${newProduct.slug}`);

    await recordActivity({
      actor,
      action: 'CREATE',
      module: 'PRODUCTS',
      description: `Menambahkan produk ${newProduct.name}.`,
      entityType: 'Product',
      entityId: newProduct.id,
      metadata: { slug: newProduct.slug, status: newProduct.status },
      request
    });

    return NextResponse.json({
      code: 201,
      status: 'success',
      data: mapProductRelations(newProduct as unknown as Parameters<typeof mapProductRelations>[0])
    });
  } catch (error: unknown) {
    console.error('Error creating product:', JSON.stringify(error, Object.getOwnPropertyNames(error as object), 2));
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const target =
        'meta' in error && error.meta && typeof error.meta === 'object' && 'target' in error.meta
          ? (error.meta as { target: string[] }).target
          : ['unknown'];
      const targetList = Array.isArray(target) ? target : [String(target)];
      const isSlug = targetList.includes('slug');
      const targetStr = targetList.join(', ');
      return NextResponse.json(
        {
          code: 409,
          status: 'error',
          message: isSlug
            ? 'Nama produk sudah digunakan (slug duplikat). Silakan gunakan nama produk yang berbeda.'
            : `Data ${targetStr} sudah terdaftar dan tidak boleh duplikat.`
        },
        { status: 409 }
      );
    }

    const errCode = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : undefined;
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to create product', detail: errMsg, prismaCode: errCode },
      { status: 500 }
    );
  }
}
