import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type ProductReleaseDatabase = Prisma.TransactionClient | typeof prisma;

interface ReleaseScheduleValidation {
  valid: boolean;
  date: Date | null;
  message?: string;
}

/**
 * Validates and normalizes the release schedule used by product create/update APIs.
 * Products that are not scheduled for a coming-soon release never retain a release date.
 */
export function validateReleaseSchedule(
  status: string,
  releaseDate: unknown,
  now = new Date()
): ReleaseScheduleValidation {
  if (status !== 'COMING_SOON') {
    return { valid: true, date: null };
  }

  if (typeof releaseDate !== 'string' || !releaseDate.trim()) {
    return {
      valid: false,
      date: null,
      message: 'Produk Coming Soon wajib memiliki tanggal rilis.'
    };
  }

  const parsedDate = new Date(releaseDate);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate <= now) {
    return {
      valid: false,
      date: null,
      message: 'Tanggal rilis Coming Soon harus berada di masa depan.'
    };
  }

  return { valid: true, date: parsedDate };
}

/**
 * Releases every scheduled product that is due. Stock is read from variants at
 * release time so the owner can adjust quantities before the scheduled release.
 */
export async function syncDueProductReleases(
  database: ProductReleaseDatabase = prisma,
  now = new Date()
): Promise<number> {
  const dueProducts = await database.product.findMany({
    where: {
      status: 'COMING_SOON',
      releaseDate: { lte: now },
      deletedAt: null
    },
    select: {
      id: true,
      stockMode: true,
      variants: {
        select: { stock: true }
      }
    }
  });

  let updatedCount = 0;

  for (const product of dueProducts) {
    const totalStock = product.variants.reduce((total, variant) => total + Math.max(0, variant.stock), 0);
    const nextStatus = product.stockMode === 'ALWAYS_AVAILABLE' || totalStock > 0
      ? 'AVAILABLE'
      : 'SOLD_OUT';

    const result = await database.product.updateMany({
      where: {
        id: product.id,
        status: 'COMING_SOON'
      },
      data: { status: nextStatus }
    });

    updatedCount += result.count;
  }

  return updatedCount;
}
