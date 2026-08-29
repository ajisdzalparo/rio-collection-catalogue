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
      price,
      status,
      imageUrl,
      images,
      description,
      variants,
      edition
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
        price: Number(price),
        status,
        imageUrl,
        images,
        description,
        variants: {
          createMany: {
            data: (variants || []).map((v: { size: string; inStock?: boolean }) => ({
              size: v.size,
              inStock: Boolean(v.inStock)
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
