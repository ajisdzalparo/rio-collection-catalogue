import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deductStock } from '@/lib/stock';

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch all products matching the productIds of order items to check if any are pre-order (COMING_SOON)
    const productIds = Array.from(
      new Set(
        orders
          .flatMap((o) => o.items)
          .map((i) => i.productId)
          .filter(Boolean) as string[]
      )
    );

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, status: true }
    });

    const preOrderProductIds = new Set(
      products
        .filter((p) => p.status === 'COMING_SOON')
        .map((p) => p.id)
    );

    const enrichedOrders = orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        isPreOrder: item.productId ? preOrderProductIds.has(item.productId) : false
      }))
    }));

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: enrichedOrders
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
    const { fullName, whatsapp, address, notes, items, shippingFee } = body;

    if (!fullName || !whatsapp || !address) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Data pelanggan (nama, whatsapp, alamat) wajib diisi' },
        { status: 400 }
      );
    }

    // Normalize the WhatsApp number (08xx / 8xx / +62xxx -> 62xxxxxxxxxx).
    const normalizedWhatsapp = String(whatsapp).replace(/[^0-9]/g, '').replace(/^0/, '62').replace(/^6262+/, '62');
    if (!normalizedWhatsapp.startsWith('62') || normalizedWhatsapp.length < 9) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Nomor WhatsApp tidak valid. Gunakan format 08xx atau 628xx.' },
        { status: 400 }
      );
    }

    // Exclusive drops: each customer may only hold ONE active order.
    const blockingStatuses = ['PENDING', 'CONFIRMED', 'WAITING_PAYMENT', 'PAID', 'FULFILLED'];
    const existingActiveOrder = await prisma.order.findFirst({
      where: { whatsapp: normalizedWhatsapp, status: { in: blockingStatuses } },
      select: { orderNumber: true, status: true }
    });
    if (existingActiveOrder) {
      return NextResponse.json(
        {
          code: 409,
          status: 'error',
          message: `Kamu sudah memiliki pesanan aktif #${existingActiveOrder.orderNumber}. Satu customer hanya boleh satu pesanan untuk drop ini.`
        },
        { status: 409 }
      );
    }

    // Process items & resolve product details from DB to prevent client price/qty manipulation
    let computedTotal = 0;
    const resolvedItems = await Promise.all(
      ((items as OrderItemPayload[]) || []).map(async (item: OrderItemPayload) => {
        let name = item.name;
        let price = 0;

        if (item.productId) {
          const dbProduct = await prisma.product.findUnique({
            where: { id: item.productId }
          });
          if (dbProduct) {
            price = dbProduct.price; // Always override client price with authoritative DB price
            if (!name) name = dbProduct.name;
          }
        }

        if (!price) {
          price = Math.max(0, Number(item.price || 0));
        }

        // Validate quantity: must be an integer >= 1
        const rawQty = Number(item.quantity);
        const qty = Number.isInteger(rawQty) && rawQty >= 1 ? rawQty : 1;
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

    const quotedShippingFee = Number.isFinite(Number(shippingFee)) && Number(shippingFee) >= 0
      ? Math.round(Number(shippingFee))
      : 15000;
    const finalTotalPrice = computedTotal + quotedShippingFee;

    const count = await prisma.order.count();
    const orderNumber = `RC-${String(8800 + count + 1).padStart(4, '0')}`;

    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. Deduct stock first. This will throw if stock is insufficient.
      await deductStock(resolvedItems, tx);

      // 2. Create the order.
      return await tx.order.create({
        data: {
          orderNumber,
          fullName,
          whatsapp: normalizedWhatsapp,
          address,
          notes: notes || '',
          quotedShippingFee,
          shippingFee: quotedShippingFee,
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit order request';
    const isOutOfStock = errorMessage.includes('tidak mencukupi') || errorMessage.includes('tidak ditemukan');
    return NextResponse.json(
      { code: isOutOfStock ? 400 : 500, status: 'error', message: errorMessage },
      { status: isOutOfStock ? 400 : 500 }
    );
  }
}
