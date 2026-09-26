import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { orderSchema } from '@/lib/order-schema';
import { createOrder, OrderError } from '@/lib/create-order';
import { verifyOtp, OtpError } from '@/lib/otp';
import { getCustomerFromRequest } from '@/lib/customer-auth';
import { allowCheckoutAttempt } from '@/lib/checkout-rate-limit';
import { normalizeEmail, normalizeWhatsapp } from '@/lib/customer-identity';
import { publishOrderCreated } from '@/lib/order-notifications.server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || searchParams.get('q')?.trim() || '';
    const statusParam = searchParams.get('status')?.trim() || '';
    const productParam = searchParams.get('product')?.trim() || '';
    const startDateParam = searchParams.get('startDate')?.trim() || '';
    const endDateParam = searchParams.get('endDate')?.trim() || '';
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize') || searchParams.get('limit');

    const where: Prisma.OrderWhereInput = {};

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

    if (productParam) {
      const products = productParam
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      if (products.length) {
        where.items = { some: { name: { in: products } } };
      }
    }

    if (startDateParam || endDateParam) {
      where.createdAt = {};
      if (startDateParam) {
        const start = new Date(startDateParam);
        start.setHours(0, 0, 0, 0);
        where.createdAt.gte = start;
      }
      if (endDateParam) {
        const end = new Date(endDateParam);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { whatsapp: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { referralCodeSnapshot: { contains: search, mode: 'insensitive' } },
        { referralPartnerSnapshot: { contains: search, mode: 'insensitive' } },
        { items: { some: { name: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    const isPaginated = Boolean(pageParam || pageSizeParam);
    const page = Math.max(1, parseInt(pageParam || '1', 10) || 1);
    const pageSize = Math.max(1, parseInt(pageSizeParam || '10', 10) || 10);
    const skip = isPaginated ? (page - 1) * pageSize : undefined;
    const take = isPaginated ? pageSize : undefined;

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take,
        include: { items: true },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: orders.flatMap((order) =>
            order.items.flatMap((item) => (item.productId ? [item.productId] : []))
          )
        }
      },
      select: { id: true, status: true, hpp: true }
    });
    const preOrderIds = new Set(
      products.filter((product) => product.status === 'PRE_ORDER').map((product) => product.id)
    );
    const productHpp = new Map(products.map((product) => [product.id, product.hpp]));

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: orders.map((order) => ({
        ...order,
        items: order.items.map((item) => ({
          ...item,
          isPreOrder: item.isPreOrder ?? (item.productId ? preOrderIds.has(item.productId) : false),
          cogs: item.productId ? (productHpp.get(item.productId) ?? undefined) : undefined
        }))
      })),
      meta: {
        page: isPaginated ? page : 1,
        pageSize: isPaginated ? pageSize : total,
        total,
        totalPages: isPaginated ? Math.max(1, Math.ceil(total / pageSize)) : 1
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const parsed = orderSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        {
          code: 400,
          status: 'error',
          message: 'Data pesanan tidak lengkap atau tidak valid.',
          details: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const caller =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      parsed.data.whatsapp.replace(/\D/g, '').replace(/^0/, '62');
    if (!allowCheckoutAttempt(caller)) {
      return NextResponse.json(
        {
          code: 429,
          status: 'error',
          message: 'Terlalu banyak percobaan. Tunggu satu menit lalu coba lagi.'
        },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // Resolve identity on the server. Never trust a customer ID supplied by the browser.
    const loggedCustomer = await getCustomerFromRequest(request);
    let orderEmail: string;
    let orderWhatsapp: string;
    let customerId: string;

    if (loggedCustomer) {
      if (!loggedCustomer.whatsapp) {
        return NextResponse.json(
          {
            code: 409,
            status: 'error',
            message: 'Tambahkan nomor WhatsApp terverifikasi di Profil sebelum membuat pesanan.'
          },
          { status: 409 }
        );
      }
      orderEmail = normalizeEmail(loggedCustomer.email);
      orderWhatsapp = normalizeWhatsapp(loggedCustomer.whatsapp);
      customerId = loggedCustomer.id;
    } else {
      orderEmail = normalizeEmail(parsed.data.email);
      orderWhatsapp = normalizeWhatsapp(parsed.data.whatsapp);
      if (!parsed.data.otpCode) {
        return NextResponse.json(
          {
            code: 400,
            status: 'error',
            message: 'Kode OTP email wajib diverifikasi sebelum memesan.'
          },
          { status: 400 }
        );
      }

      await verifyOtp({
        email: orderEmail,
        code: parsed.data.otpCode,
        type: 'ORDER',
        consume: true
      });

      const customer = await prisma.customer.upsert({
        where: { email: orderEmail },
        create: {
          email: orderEmail,
          fullName: parsed.data.fullName,
          whatsapp: orderWhatsapp
        },
        update: {}
      });
      customerId = customer.id;
    }

    const order = await createOrder({
      ...parsed.data,
      email: orderEmail,
      whatsapp: orderWhatsapp,
      customerId
    });
    publishOrderCreated();

    return NextResponse.json(
      {
        code: 201,
        status: 'success',
        data: {
          orderNumber: order.orderNumber,
          totalAmount: order.totalPrice,
          status: order.status,
          currency: 'IDR'
        }
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof OtpError || error instanceof OrderError) {
      return NextResponse.json(
        { code: error.status, status: 'error', message: error.message },
        { status: error.status }
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return NextResponse.json(
        { code: 409, status: 'error', message: 'Stok sedang diperbarui. Silakan coba lagi.' },
        { status: 409 }
      );
    }
    const stockError =
      error instanceof Error &&
      (error.message.includes('tidak mencukupi') || error.message.includes('tidak ditemukan'));
    console.error('Error creating order:', error);
    return NextResponse.json(
      {
        code: stockError ? 400 : 500,
        status: 'error',
        message: stockError ? error.message : 'Pesanan gagal disimpan. Silakan coba lagi.'
      },
      { status: stockError ? 400 : 500 }
    );
  }
}
