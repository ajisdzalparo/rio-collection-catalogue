import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeProductAvailability } from '@/lib/product-availability';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        variants: {
          select: {
            size: true,
            inStock: true,
            stock: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: products.map(normalizeProductAvailability)
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
      status,
      imageUrl,
      images,
      description,
      variants,
      edition,
      imageDetails,
      storyTitle,
      storyText,
      materialsAndCare
    } = body;

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
        status: status || 'AVAILABLE',
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
        storyTitle: storyTitle || null,
        storyText: storyText || null,
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
        }
      },
      include: {
        variants: true
      }
    });

    return NextResponse.json({
      code: 201,
      status: 'success',
      data: newProduct
    });
  } catch (error: unknown) {
    console.error('Error creating product:', JSON.stringify(error, Object.getOwnPropertyNames(error as object), 2));
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const target =
        'meta' in error && error.meta && typeof error.meta === 'object' && 'target' in error.meta
          ? (error.meta as { target: string[] }).target
          : ['unknown'];
      return NextResponse.json(
        {
          code: 409,
          status: 'error',
          message: `Duplicate value: field ${Array.isArray(target) ? target.join(', ') : target} already exists`
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
