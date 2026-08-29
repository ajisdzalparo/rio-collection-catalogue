import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({
      code: 200,
      status: 'success',
      data: orders
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
    const body = await request.json();
    const { fullName, whatsapp, address, notes, items, totalPrice } = body;

    const count = await prisma.order.count();
    const orderNumber = `RC-${String(8800 + count + 1).padStart(4, '0')}`;

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        fullName,
        whatsapp,
        address,
        notes: notes || '',
        totalPrice: Number(totalPrice),
        status: 'PENDING',
        items: {
          create: (items || []).map(
            (item: { productId?: string; name: string; size: string; price: number; quantity: number }) => ({
              productId: item.productId || null,
              name: item.name,
              size: item.size,
              price: Number(item.price),
              quantity: Number(item.quantity)
            })
          )
        }
      },
      include: {
        items: true
      }
    });

    return NextResponse.json(
      {
        code: 201,
        status: 'success',
        message: 'Order request received successfully',
        data: {
          orderNumber: newOrder.orderNumber,
          totalAmount: newOrder.totalPrice,
          status: 'PENDING_CONFIRMATION',
          currency: 'IDR',
          estimatedConfirmation: '1x24 Jam via WhatsApp'
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to submit order request' },
      { status: 500 }
    );
  }
}
