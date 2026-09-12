import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapProductRelations } from '@/lib/catalogue-relations';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const journalIdsSchema = z.array(z.string().min(1)).max(100).default([]);
const journalSummarySelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  date: true,
  imageUrl: true
} as const;

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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
      status,
      imageUrl,
      images,
      description,
      variants,
      edition,
      imageDetails,
      hpp,
      stock,
      stockMode,
      orderLimitMode,
      maxPurchaseLimit,
      materialsAndCare,
      journalIds
    } = body;
    const parsedJournalIds = journalIdsSchema.safeParse(journalIds);
    if (!parsedJournalIds.success) {
      return NextResponse.json({ message: 'Relasi jurnal tidak valid' }, { status: 400 });
    }

    const updatedProduct = await prisma.$transaction(
      async (tx) => {
        await tx.productVariant.deleteMany({ where: { productId: id } });
        await tx.productJournal.deleteMany({ where: { productId: id } });
        return tx.product.update({
          where: { id },
          data: {
            name,
            slug,
            edition,
            category,
            color,
            colorHex,
            colors: Array.isArray(colors) && colors.length > 0 ? colors : [color].filter(Boolean),
            colorHexes:
              Array.isArray(colorHexes) && colorHexes.length > 0
                ? colorHexes
                : [colorHex || '#1A1A1A'],
            price: Number(price),
            hpp: hpp === undefined ? null : Number(hpp),
            stock: stock === undefined ? 0 : Number(stock),
            stockMode: stockMode || 'QUANTITY',
            orderLimitMode: orderLimitMode || 'UNLIMITED',
            maxPurchaseLimit: maxPurchaseLimit !== undefined ? Number(maxPurchaseLimit) : 1,
            status,
            imageUrl,
            images,
            imageDetails: imageDetails || null,
            description,
            materialsAndCare: materialsAndCare || null,
            variants: {
              createMany: {
                data: (variants || []).map(
                  (v: { size: string; inStock?: boolean; stock?: number }) => ({
                    size: v.size,
                    inStock: Boolean(v.inStock),
                    stock: Number(v.stock ?? (v.inStock ? 10 : 0))
                  })
                )
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
      },
      {
        maxWait: 15000,
        timeout: 20000
      }
    );
    revalidatePath('/catalogue');
    revalidatePath('/archive');
    revalidatePath(`/products/${updatedProduct.slug}`);

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: mapProductRelations(
        updatedProduct as unknown as Parameters<typeof mapProductRelations>[0]
      )
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    });
    revalidatePath('/catalogue');
    revalidatePath('/archive');
    return NextResponse.json({
      code: 200,
      status: 'success',
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
