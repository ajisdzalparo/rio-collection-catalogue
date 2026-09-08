import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { orderSchema } from '@/lib/order-schema';
import { createOrder, OrderError } from '@/lib/create-order';
import { verifyRecaptcha, CaptchaError } from '@/lib/recaptcha';
import { allowCheckoutAttempt } from '@/lib/checkout-rate-limit';

export async function GET() {
  try {
    const orders = await prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } });
    const products = await prisma.product.findMany({
      where: { id: { in: orders.flatMap((order) => order.items.flatMap((item) => item.productId ? [item.productId] : [])) } },
      select: { id: true, status: true }
    });
    const preOrderIds = new Set(products.filter((product) => product.status === 'PRE_ORDER').map((product) => product.id));
    return NextResponse.json({ code: 200, status: 'success', data: orders.map((order) => ({
      ...order, items: order.items.map((item) => ({
        ...item, isPreOrder: item.isPreOrder ?? (item.productId ? preOrderIds.has(item.productId) : false)
      }))
    })) });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ code: 500, status: 'error', message: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const parsed = orderSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ code: 400, status: 'error', message: 'Data pesanan tidak lengkap atau tidak valid.', details: parsed.error.flatten() }, { status: 400 });
    const caller = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip') || parsed.data.whatsapp.replace(/\D/g, '').replace(/^0/, '62');
    if (!allowCheckoutAttempt(caller)) {
      return NextResponse.json({ code: 429, status: 'error', message: 'Terlalu banyak percobaan. Tunggu satu menit lalu coba lagi.' }, { status: 429, headers: { 'Retry-After': '60' } });
    }
    await verifyRecaptcha(parsed.data.captchaToken);
    const order = await createOrder(parsed.data);
    return NextResponse.json({ code: 201, status: 'success', data: {
      orderNumber: order.orderNumber, totalAmount: order.totalPrice, status: order.status, currency: 'IDR'
    } }, { status: 201 });
  } catch (error) {
    if (error instanceof CaptchaError || error instanceof OrderError) {
      return NextResponse.json({ code: error.status, status: 'error', message: error.message }, { status: error.status });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return NextResponse.json({ code: 409, status: 'error', message: 'Stok sedang diperbarui. Silakan coba lagi.' }, { status: 409 });
    }
    const stockError = error instanceof Error && (error.message.includes('tidak mencukupi') || error.message.includes('tidak ditemukan'));
    console.error('Error creating order:', error);
    return NextResponse.json({ code: stockError ? 400 : 500, status: 'error', message: stockError ? error.message : 'Pesanan gagal disimpan. Silakan coba lagi.' }, { status: stockError ? 400 : 500 });
  }
}
