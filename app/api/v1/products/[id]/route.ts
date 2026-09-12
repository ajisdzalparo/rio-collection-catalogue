import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapProductRelations } from '@/lib/catalogue-relations';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const journalIdsSchema = z.array(z.string().min(1)).max(100);
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

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        journalLinks: true
      }
    });

    if (!existingProduct) {
      return NextResponse.json({ message: 'Produk tidak ditemukan' }, { status: 404 });
    }

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

    let parsedJournalIdsData: string[] | undefined = undefined;
    if (journalIds !== undefined) {
      const parsedJournalIds = journalIdsSchema.safeParse(journalIds);
      if (!parsedJournalIds.success) {
        return NextResponse.json({ message: 'Relasi jurnal tidak valid' }, { status: 400 });
      }
      parsedJournalIdsData = parsedJournalIds.data;
    }

    const updatedProduct = await prisma.$transaction(
      async (tx) => {
        if (Array.isArray(variants)) {
          await tx.productVariant.deleteMany({ where: { productId: id } });
        }
        if (parsedJournalIdsData !== undefined) {
          await tx.productJournal.deleteMany({ where: { productId: id } });
        }

        const dataToUpdate: Record<string, unknown> = {};

        if (name !== undefined) dataToUpdate.name = name;
        if (slug !== undefined) dataToUpdate.slug = slug;
        if (edition !== undefined) dataToUpdate.edition = edition;
        if (category !== undefined) dataToUpdate.category = category;
        if (color !== undefined) dataToUpdate.color = color;
        if (colorHex !== undefined) dataToUpdate.colorHex = colorHex;
        if (colors !== undefined) {
          dataToUpdate.colors =
            Array.isArray(colors) && colors.length > 0
              ? colors
              : [color || existingProduct.color].filter(Boolean);
        }
        if (colorHexes !== undefined) {
          dataToUpdate.colorHexes =
            Array.isArray(colorHexes) && colorHexes.length > 0
              ? colorHexes
              : [colorHex || existingProduct.colorHex || '#1A1A1A'];
        }
        if (price !== undefined) dataToUpdate.price = Number(price);
        if (hpp !== undefined) dataToUpdate.hpp = hpp === null ? null : Number(hpp);
        if (stock !== undefined) dataToUpdate.stock = Number(stock);
        if (stockMode !== undefined) dataToUpdate.stockMode = stockMode;
        if (orderLimitMode !== undefined) dataToUpdate.orderLimitMode = orderLimitMode;
        if (maxPurchaseLimit !== undefined)
          dataToUpdate.maxPurchaseLimit = Number(maxPurchaseLimit);
        if (status !== undefined) dataToUpdate.status = status;
        if (imageUrl !== undefined) dataToUpdate.imageUrl = imageUrl;
        if (images !== undefined) dataToUpdate.images = images;
        if (imageDetails !== undefined) dataToUpdate.imageDetails = imageDetails;
        if (description !== undefined) dataToUpdate.description = description;
        if (materialsAndCare !== undefined) dataToUpdate.materialsAndCare = materialsAndCare;

        if (Array.isArray(variants)) {
          dataToUpdate.variants = {
            createMany: {
              data: variants.map((v: { size: string; inStock?: boolean; stock?: number }) => ({
                size: v.size,
                inStock: Boolean(v.inStock),
                stock: Number(v.stock ?? (v.inStock ? 10 : 0))
              }))
            }
          };
        }

        if (parsedJournalIdsData !== undefined) {
          dataToUpdate.journalLinks = {
            createMany: {
              data: parsedJournalIdsData.map((journalId) => ({ journalId })),
              skipDuplicates: true
            }
          };
        }

        return tx.product.update({
          where: { id },
          data: dataToUpdate,
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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return PUT(request, context);
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
