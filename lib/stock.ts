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

    const newVariantStock = variant.stock - item.quantity;

    // Update variant stock and inStock status
    await tx.productVariant.update({
      where: { id: variant.id },
      data: {
        stock: newVariantStock,
        inStock: newVariantStock > 0
      }
    });

    // Update overall product total stock
    const newProductStock = Math.max(0, product.stock - item.quantity);
    await tx.product.update({
      where: { id: product.id },
      data: {
        stock: newProductStock
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

    const newVariantStock = variant.stock + item.quantity;

    // Update variant stock and inStock status
    await tx.productVariant.update({
      where: { id: variant.id },
      data: {
        stock: newVariantStock,
        inStock: true // Since we added stock back, it is definitely in stock
      }
    });

    // Update overall product total stock
    const newProductStock = product.stock + item.quantity;
    await tx.product.update({
      where: { id: product.id },
      data: {
        stock: newProductStock
      }
    });
  }
}
