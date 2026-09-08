import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { deductStock } from '@/lib/stock';
import { orderSchema } from '@/lib/order-schema';
import { calculateShippingCost } from '@/lib/rajaongkir';
import { isOrderableStatus, normalizeProductAvailability } from '@/lib/product-availability';

export class OrderError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); }
}

export async function createOrder(input: z.infer<typeof orderSchema>) {
  const whatsapp = input.whatsapp.replace(/[^0-9]/g, '').replace(/^0/, '62');
  if (!/^62\d{7,13}$/.test(whatsapp)) throw new OrderError('Nomor WhatsApp tidak valid. Gunakan format 08xx atau 628xx.');
  const settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } });
  const courier = input.shipping.courier.toLowerCase();
  const allowed = (settings?.enabledCouriers ?? 'jne,pos,tiki,sicepat,jnt').split(',').map((value) => value.trim().toLowerCase());
  if (!allowed.includes(courier)) throw new OrderError('Kurir tidak tersedia. Pilih ulang pengiriman.');
  const rates = await calculateShippingCost({
    destination: input.shipping.destination, destinationType: 'city',
    weight: Math.max(1000, input.items.reduce((sum, item) => sum + item.quantity, 0) * 350), courier
  });
  const service = rates.find((rate) => rate.code.toLowerCase() === courier)?.costs
    .find((rate) => rate.service === input.shipping.service);
  const shippingFee = service?.cost[0]?.value;
  if (!service || shippingFee === undefined || !Number.isInteger(shippingFee) || shippingFee < 0) {
    throw new OrderError('Layanan pengiriman tidak tersedia. Pilih ulang pengiriman.');
  }
  if (shippingFee !== input.shippingFee) throw new OrderError('Tarif ongkir berubah. Muat ulang halaman untuk mendapatkan tarif terbaru.', 409);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.order.findFirst({
      where: { whatsapp, status: { in: ['PENDING', 'CONFIRMED', 'WAITING_PAYMENT', 'PAID', 'FULFILLED'] } },
      select: { orderNumber: true }
    });
    if (existing) throw new OrderError(`Kamu sudah memiliki pesanan aktif #${existing.orderNumber}. Hubungi toko untuk melanjutkan pesanan tersebut.`, 409);
    const products = await tx.product.findMany({
      where: { id: { in: input.items.map((item) => item.productId) } }, include: { variants: true }
    });
    const items = input.items.map((item) => {
      const raw = products.find((product) => product.id === item.productId);
      if (!raw) throw new OrderError('Produk tidak ditemukan. Pilih ulang produk.');
      const product = normalizeProductAvailability(raw);
      if (!isOrderableStatus(product.status)) throw new OrderError(`${product.name} tidak tersedia untuk dipesan.`);
      const variant = product.variants.find((value) => value.size === item.size);
      if (!variant?.inStock) throw new OrderError(`Ukuran ${item.size} untuk ${product.name} tidak tersedia.`);
      const colors = product.colors.length ? product.colors : [product.color];
      if (item.color && !colors.includes(item.color)) throw new OrderError('Warna produk tidak tersedia. Pilih ulang warna.');
      return {
        productId: product.id, name: item.color ? `${product.name} — ${item.color}` : product.name,
        price: product.price, size: item.size, quantity: item.quantity, isPreOrder: product.status === 'PRE_ORDER'
      };
    });
    await deductStock(items, tx);
    return tx.order.create({
      data: {
        orderNumber: `RC-${randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`,
        fullName: input.fullName, whatsapp, address: input.address, notes: input.notes ?? '',
        courierName: `${courier.toUpperCase()} ${service.service}`,
        quotedShippingFee: shippingFee, shippingFee,
        totalPrice: items.reduce((sum, item) => sum + item.price * item.quantity, shippingFee),
        status: 'PENDING', items: { create: items }
      }, include: { items: true }
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
