import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

interface OrderItemInfo {
  productId: string | null;
  size: string;
  quantity: number;
}

/**
 * Deducts stock for a list of order items if the product's stockMode is 'QUANTITY'.
 * Throws an error if any variant has insufficient stock.
 */
export async function deductStock(items: OrderItemInfo[], tx: Prisma.TransactionClient = prisma) {
  for (const item of items) {
    if (!item.productId) continue;

    const product = await tx.product.findUnique({
      where: { id: item.productId }
    });

    if (!product || product.stockMode !== 'QUANTITY') continue;

    // Find the variant for this product and size
    const variant = await tx.productVariant.findFirst({
      where: { productId: item.productId, size: item.size }
    });

    if (!variant) {
      throw new Error(`Variant untuk produk ${product.name} dengan ukuran ${item.size} tidak ditemukan.`);
    }

    if (variant.stock < item.quantity) {
      throw new Error(`Stok untuk produk ${product.name} (Ukuran ${item.size}) tidak mencukupi. Tersedia: ${variant.stock}, diminta: ${item.quantity}.`);
    }

    const deduction = await tx.productVariant.updateMany({
      where: { id: variant.id, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } }
    });
    if (deduction.count !== 1) throw new Error(`Stok ${product.name} tidak mencukupi. Silakan pilih ulang ukuran.`);
    await tx.productVariant.updateMany({ where: { id: variant.id, stock: 0 }, data: { inStock: false } });

    const totals = await tx.productVariant.aggregate({ where: { productId: product.id }, _sum: { stock: true } });
    await tx.product.update({
      where: { id: product.id },
      data: {
        stock: totals._sum.stock ?? 0
      }
    });
  }
}

/**
 * Restores stock for a list of order items if the product's stockMode is 'QUANTITY'.
 */
export async function restoreStock(items: OrderItemInfo[], tx: Prisma.TransactionClient = prisma) {
  for (const item of items) {
    if (!item.productId) continue;

    const product = await tx.product.findUnique({
      where: { id: item.productId }
    });

    if (!product || product.stockMode !== 'QUANTITY') continue;

    const variant = await tx.productVariant.findFirst({
      where: { productId: item.productId, size: item.size }
    });

    if (!variant) continue;

    // Update variant stock and inStock status
    await tx.productVariant.update({
      where: { id: variant.id },
      data: {
        stock: { increment: item.quantity },
        inStock: true // Since we added stock back, it is definitely in stock
      }
    });

    // Update overall product total stock
    const totals = await tx.productVariant.aggregate({ where: { productId: product.id }, _sum: { stock: true } });
    await tx.product.update({
      where: { id: product.id },
      data: {
        stock: totals._sum.stock ?? 0
      }
    });
  }
}
