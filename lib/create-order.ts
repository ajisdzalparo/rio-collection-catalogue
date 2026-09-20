import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { orderSchema } from '@/lib/order-schema';
import { calculateShippingCost } from '@/lib/rajaongkir';
import { isOrderableStatus, normalizeProductAvailability } from '@/lib/product-availability';
import { normalizeEmail, normalizeWhatsapp } from '@/lib/customer-identity';
import { parseEnabledCourierCodes } from '@/lib/couriers';
import { syncDueProductReleases } from '@/lib/product-release';
import { calculateReferralAmounts, normalizeReferralCode, type BenefitMode } from '@/lib/referral';

export class OrderError extends Error {
  constructor(
    message: string,
    public readonly status = 400
  ) {
    super(message);
  }
}

export async function createOrder(input: z.infer<typeof orderSchema> & { customerId: string }) {
  await syncDueProductReleases();
  const whatsapp = normalizeWhatsapp(input.whatsapp);
  const email = normalizeEmail(input.email);
  if (!/^62\d{7,13}$/.test(whatsapp))
    throw new OrderError('Nomor WhatsApp tidak valid. Gunakan format 08xx atau 628xx.');
  const settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } });
  const courier = input.shipping.courier.toLowerCase();
  const allowed = parseEnabledCourierCodes(settings?.enabledCouriers);
  if (!allowed.includes(courier))
    throw new OrderError('Kurir tidak tersedia. Pilih ulang pengiriman.');
  const rates = await calculateShippingCost({
    destination: input.shipping.destination,
    destinationType: 'city',
    weight: Math.max(1000, input.items.reduce((sum, item) => sum + item.quantity, 0) * 350),
    courier
  });
  const service = rates
    .find((rate) => rate.code.toLowerCase() === courier)
    ?.costs.find((rate) => rate.service === input.shipping.service);
  const shippingFee = service?.cost[0]?.value;
  if (!service || shippingFee === undefined || !Number.isInteger(shippingFee) || shippingFee < 0) {
    throw new OrderError('Layanan pengiriman tidak tersedia. Pilih ulang pengiriman.');
  }
  if (shippingFee !== input.shippingFee)
    throw new OrderError(
      'Tarif ongkir berubah. Muat ulang halaman untuk mendapatkan tarif terbaru.',
      409
    );

  return prisma.$transaction(
    async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: input.items.map((item) => item.productId) } },
        include: { variants: true }
      });
      const items = input.items.map((item) => {
        const raw = products.find((product) => product.id === item.productId);
        if (!raw)
          throw new OrderError('Produk tidak ditemukan. Silakan periksa kembali keranjang Anda.');
        const product = normalizeProductAvailability(raw);
        if (!isOrderableStatus(product.status))
          throw new OrderError(
            `Mohon maaf, produk "${product.name}" saat ini sedang tidak tersedia.`
          );
        const variant = product.variants.find((value) => value.size === item.size);
        if (!variant?.inStock)
          throw new OrderError(
            `Mohon maaf, ukuran ${item.size} untuk produk "${product.name}" saat ini tidak tersedia.`
          );
        if (raw.stockMode === 'QUANTITY') {
          const rawVariant = raw.variants.find((v) => v.size === item.size);
          const availableStock = rawVariant?.stock ?? 0;
          if (!rawVariant || availableStock < item.quantity) {
            if (availableStock <= 0) {
              throw new OrderError(
                `Mohon maaf, stok untuk produk "${product.name}" (Ukuran ${item.size}) saat ini sedang habis.`
              );
            }
            throw new OrderError(
              `Mohon maaf, stok untuk produk "${product.name}" (Ukuran ${item.size}) tersisa ${availableStock} pcs.`
            );
          }
        }
        const colors = product.colors.length ? product.colors : [product.color];
        if (item.color && !colors.includes(item.color))
          throw new OrderError(`Pilihan warna untuk produk "${product.name}" tidak tersedia.`);
        return {
          productId: product.id,
          name: item.color ? `${product.name} — ${item.color}` : product.name,
          price: product.price,
          size: item.size,
          quantity: item.quantity,
          isPreOrder: product.status === 'PRE_ORDER',
          orderLimitMode: raw.orderLimitMode
        };
      });

      // Check order limits per customer/user
      for (const item of items) {
        if (item.orderLimitMode === 'ONCE_PER_USER') {
          if (item.quantity > 1) {
            throw new OrderError(
              `Produk "${item.name}" adalah edisi terbatas dan hanya dapat dipesan maksimal 1 pcs.`
            );
          }
          const priorOrder = await tx.order.findFirst({
            where: {
              OR: [{ customerId: input.customerId }, { email }, { whatsapp }],
              status: { not: 'CANCELLED' },
              items: { some: { productId: item.productId } }
            }
          });
          if (priorOrder) {
            throw new OrderError(
              `Produk "${item.name}" adalah edisi terbatas dan hanya dapat dipesan 1 kali per pelanggan. Anda sudah pernah memesan produk ini sebelumnya (No. Pesanan: #${priorOrder.orderNumber}).`
            );
          }
        }
      }

      const orderItemsToDeduct = items.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        size: item.size,
        quantity: item.quantity,
        isPreOrder: item.isPreOrder
      }));
      const referralCode = input.referralCode
        ? await tx.referralCode.findUnique({
            where: { code: normalizeReferralCode(input.referralCode) },
            include: { partner: true }
          })
        : null;
      if (input.referralCode && (!referralCode?.isActive || !referralCode.partner)) {
        throw new OrderError('Kode referral tidak tersedia. Hapus atau ganti kode lalu coba lagi.');
      }
      const referralAmounts = referralCode
        ? calculateReferralAmounts(
            orderItemsToDeduct,
            referralCode.discountMode as BenefitMode,
            referralCode.discountValue,
            referralCode.rewardKind === 'CASH' ? (referralCode.rewardMode as BenefitMode) : null,
            referralCode.rewardKind === 'CASH' ? referralCode.rewardValue : null
          )
        : null;
      const subtotal = orderItemsToDeduct.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      return tx.order.create({
        data: {
          orderNumber: `RC-${randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`,
          fullName: input.fullName,
          email,
          customerId: input.customerId,
          whatsapp,
          address: input.address,
          notes: input.notes ?? '',
          courierName: `${courier.toUpperCase()} ${service.service}`,
          quotedShippingFee: shippingFee,
          shippingFee,
          totalPrice: subtotal - (referralAmounts?.discountAmount ?? 0) + shippingFee,
          discountAmount: referralAmounts?.discountAmount ?? 0,
          ...(referralCode && {
            referralCodeId: referralCode.id,
            referralCodeSnapshot: referralCode.code,
            referralPartnerSnapshot: referralCode.partner.name,
            referralDiscountMode: referralCode.discountMode,
            referralDiscountValue: referralCode.discountValue,
            referralRewardKind: referralCode.rewardKind,
            referralRewardMode: referralCode.rewardMode,
            referralRewardValue: referralCode.rewardValue,
            referralGiftEveryUnits: referralCode.giftEveryUnits,
            referralRewardAmount: referralAmounts?.rewardAmount ?? 0
          }),
          status: 'PENDING',
          items: { create: orderItemsToDeduct }
        },
        include: { items: true }
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}
