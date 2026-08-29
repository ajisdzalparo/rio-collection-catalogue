import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
      storyTitle,
      storyText,
      hpp,
      stock,
      stockMode,
      materialsAndCare
    } = body;

    // Delete existing variants and re-create updated variants
    await prisma.productVariant.deleteMany({
      where: { productId: id }
    });

    const updatedProduct = await prisma.product.update({
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
          Array.isArray(colorHexes) && colorHexes.length > 0 ? colorHexes : [colorHex || '#1A1A1A'],
        price: Number(price),
        hpp: hpp === undefined ? null : Number(hpp),
        stock: stock === undefined ? 0 : Number(stock),
        stockMode: stockMode || 'QUANTITY',
        status,
        imageUrl,
        images,
        imageDetails: imageDetails || null,
        description,
        storyTitle: storyTitle ?? null,
        storyText: storyText ?? null,
        materialsAndCare: materialsAndCare || null,
        variants: {
          createMany: {
            data: (variants || []).map((v: { size: string; inStock?: boolean; stock?: number }) => ({
              size: v.size,
              inStock: Boolean(v.inStock),
              stock: Number(v.stock ?? (v.inStock ? 10 : 0))
            }))
          }
        }
      },
      include: {
        variants: true
      }
    });

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: updatedProduct
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
    await prisma.product.delete({
      where: { id }
    });
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
