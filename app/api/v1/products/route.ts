import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        variants: {
          select: {
            size: true,
            inStock: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: products
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
    const { name, slug, category, color, colorHex, price, status, imageUrl, images, description, variants, edition } = body;

    const newProduct = await prisma.product.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        edition: edition || 'Edition 001',
        category,
        color,
        colorHex: colorHex || '#1A1A1A',
        price: Number(price),
        status: status || 'AVAILABLE',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
        images: images || [imageUrl],
        description: description || '',
        variants: {
          createMany: {
            data: variants || [
              { size: 'S', inStock: true },
              { size: 'M', inStock: true },
              { size: 'L', inStock: true },
              { size: 'XL', inStock: true }
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
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to create product' },
      { status: 500 }
    );
  }
}
