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

interface OrderItemPayload {
  productId?: string;
  name?: string;
  size?: string;
  price?: number | string;
  quantity?: number | string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, whatsapp, address, notes, items, totalPrice } = body;

    if (!fullName || !whatsapp || !address) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Data pelanggan (nama, whatsapp, alamat) wajib diisi' },
        { status: 400 }
      );
    }

    // Process items & resolve product details if missing from payload
    let computedTotal = 0;
    const resolvedItems = await Promise.all(
      ((items as OrderItemPayload[]) || []).map(async (item: OrderItemPayload) => {
        let name = item.name;
        let price = Number(item.price || 0);

        if (item.productId && (!name || !price)) {
          const dbProduct = await prisma.product.findUnique({
            where: { id: item.productId }
          });
          if (dbProduct) {
            if (!name) name = dbProduct.name;
            if (!price) price = dbProduct.price;
          }
        }

        const qty = Number(item.quantity || 1);
        computedTotal += price * qty;

        return {
          productId: item.productId || null,
          name: name || 'Produk RIO Collection',
          size: item.size || 'M',
          price,
          quantity: qty
        };
      })
    );

    const finalTotalPrice = Number(totalPrice) > 0 ? Number(totalPrice) : computedTotal;

    const count = await prisma.order.count();
    const orderNumber = `RC-${String(8800 + count + 1).padStart(4, '0')}`;

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        fullName,
        whatsapp,
        address,
        notes: notes || '',
        totalPrice: finalTotalPrice,
        status: 'PENDING',
        items: {
          create: resolvedItems
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
    console.error('Error creating order in DB:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to submit order request' },
      { status: 500 }
    );
  }
}
