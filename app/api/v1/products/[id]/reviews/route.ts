import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCustomerFromRequest } from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ slug: id }, { id }]
      },
      select: { id: true, name: true }
    });

    if (!product) {
      return NextResponse.json(
        { code: 404, status: 'error', message: 'Produk tidak ditemukan.' },
        { status: 404 }
      );
    }

    const reviews = await prisma.productReview.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: 'desc' }
    });

    const totalReviews = reviews.length;
    const totalScore = reviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = totalReviews > 0 ? Number((totalScore / totalReviews).toFixed(1)) : 0;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      if (ratingDistribution[r.rating] !== undefined) {
        ratingDistribution[r.rating]++;
      }
    });

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: {
        product: { id: product.id, name: product.name },
        averageRating,
        totalReviews,
        ratingDistribution,
        reviews
      }
    });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal memuat ulasan produk.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ slug: id }, { id }]
      },
      select: { id: true }
    });

    if (!product) {
      return NextResponse.json(
        { code: 404, status: 'error', message: 'Produk tidak ditemukan.' },
        { status: 404 }
      );
    }

    const loggedCustomer = await getCustomerFromRequest(request);
    if (!loggedCustomer) {
      return NextResponse.json(
        { code: 401, status: 'error', message: 'Anda harus masuk (login) terlebih dahulu untuk memberikan ulasan.' },
        { status: 401 }
      );
    }

    // Check if customer already submitted a review for this product
    const existingReview = await prisma.productReview.findFirst({
      where: {
        productId: product.id,
        OR: [
          { customerId: loggedCustomer.id },
          ...(loggedCustomer.email ? [{ customerEmail: loggedCustomer.email.toLowerCase() }] : [])
        ]
      }
    });

    if (existingReview) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Anda sudah memberikan ulasan untuk produk ini.' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { customerName, rating, comment } = body;

    const finalName = (loggedCustomer.fullName || customerName || loggedCustomer.email.split('@')[0]).trim();
    const finalEmail = loggedCustomer.email.trim().toLowerCase();
    const finalRating = Number(rating);
    const finalComment = (comment || '').trim();

    if (!finalName) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Nama pengulas wajib diisi.' },
        { status: 400 }
      );
    }

    if (isNaN(finalRating) || finalRating < 1 || finalRating > 5) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Rating harus antara 1 sampai 5 bintang.' },
        { status: 400 }
      );
    }

    if (!finalComment) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Tuliskan ulasan pengalaman Anda.' },
        { status: 400 }
      );
    }

    // Check verified buyer
    const orderCount = await prisma.order.count({
      where: {
        OR: [
          { customerId: loggedCustomer.id },
          ...(finalEmail ? [{ email: finalEmail }] : [])
        ],
        items: {
          some: { productId: product.id }
        },
        status: { in: ['PAID', 'FULFILLED'] }
      }
    });
    const isVerifiedBuyer = orderCount > 0;

    const newReview = await prisma.productReview.create({
      data: {
        productId: product.id,
        customerId: loggedCustomer.id,
        customerName: finalName,
        customerEmail: finalEmail,
        rating: Math.round(finalRating),
        comment: finalComment,
        isVerifiedBuyer
      }
    });

    return NextResponse.json(
      {
        code: 201,
        status: 'success',
        data: newReview,
        message: 'Terima kasih! Ulasan Anda telah berhasil disimpan.'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting product review:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal mengirim ulasan. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
