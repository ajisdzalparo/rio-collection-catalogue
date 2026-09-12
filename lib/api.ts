import type { Product, JournalArticle, Testimony } from '@/types/catalogue.types';
import { normalizeProductAvailability } from '@/lib/product-availability';
import { mapJournalRelations, mapProductRelations } from '@/lib/catalogue-relations';

const journalSummarySelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  date: true,
  imageUrl: true
} as const;

const productSummarySelect = {
  id: true,
  slug: true,
  name: true,
  imageUrl: true,
  price: true,
  status: true,
  category: true,
  color: true
} as const;

export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || '/api';
  }
  const port = process.env.PORT || 3000;
  const host = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || `http://localhost:${port}`;
  const apiPath = process.env.NEXT_PUBLIC_API_URL || '/api';
  return `${host}${apiPath}`;
}

/**
 * Fetches all customer testimonies safely for both Client and Server environments.
 */
export async function getTestimonies(): Promise<Testimony[]> {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/v1/testimonies');
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || json || [];
    } catch (error) {
      console.error('Browser testimonies fetch failed:', error);
      return [];
    }
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    const testimonies = await prisma.testimony.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return testimonies as unknown as Testimony[];
  } catch (error) {
    console.error('Server testimonies fetch failed:', error);
    return [];
  }
}

/**
 * Fetches all products safely for both Client and Server environments.
 */
export async function getProducts(): Promise<Product[]> {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/v1/products');
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || json || [];
    } catch (error) {
      console.error('Browser products fetch failed:', error);
      return [];
    }
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    const products = await prisma.product.findMany({
      where: {
        deletedAt: null
      },
      include: {
        variants: {
          select: {
            size: true,
            inStock: true,
            stock: true
          }
        },
        journalLinks: {
          include: { journal: { select: journalSummarySelect } },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return products.map((product) =>
      normalizeProductAvailability(mapProductRelations(product as unknown as Parameters<typeof mapProductRelations>[0]))
    );
  } catch (error) {
    console.error('Server products fetch failed:', error);
    return [];
  }
}

/**
 * Fetches product by slug safely for both Client and Server environments.
 */
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  if (typeof window !== 'undefined') {
    const products = await getProducts();
    return products.find((p) => p.slug === slug);
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    const product = await prisma.product.findFirst({
      where: {
        slug,
        deletedAt: null
      },
      include: {
        variants: {
          select: {
            size: true,
            inStock: true,
            stock: true
          }
        },
        journalLinks: {
          include: { journal: { select: journalSummarySelect } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    return product
      ? normalizeProductAvailability(
          mapProductRelations(product as unknown as Parameters<typeof mapProductRelations>[0])
        )
      : undefined;
  } catch (error) {
    console.error(`Server getProductBySlug failed for ${slug}:`, error);
    return undefined;
  }
}

/**
 * Fetches all journal articles safely for both Client and Server environments.
 */
export async function getJournals(): Promise<JournalArticle[]> {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/v1/journals');
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || json || [];
    } catch (error) {
      console.error('Browser journals fetch failed:', error);
      return [];
    }
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    const journals = await prisma.journal.findMany({
      include: {
        productLinks: {
          where: { product: { deletedAt: null } },
          include: { product: { select: productSummarySelect } },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return journals.map((journal) =>
      mapJournalRelations(journal as unknown as Parameters<typeof mapJournalRelations>[0])
    );
  } catch (error) {
    console.error('Server journals fetch failed:', error);
    return [];
  }
}

/**
 * Fetches journal article by slug safely for both Client and Server environments.
 */
export async function getJournalBySlug(slug: string): Promise<JournalArticle | undefined> {
  if (typeof window !== 'undefined') {
    const journals = await getJournals();
    return journals.find((j) => j.slug === slug);
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    const journal = await prisma.journal.findFirst({
      where: { slug },
      include: {
        productLinks: {
          where: { product: { deletedAt: null } },
          include: { product: { select: productSummarySelect } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    return journal
      ? mapJournalRelations(journal as unknown as Parameters<typeof mapJournalRelations>[0])
      : undefined;
  } catch (error) {
    console.error(`Server getJournalBySlug failed for ${slug}:`, error);
    return undefined;
  }
}

/**
 * Submits order request to native backend API.
 */
export async function submitOrder(orderPayload: {
  fullName: string;
  email: string;
  whatsapp: string;
  address: string;
  notes?: string;
  totalPrice?: number;
  shippingFee?: number;
  otpCode?: string;
  shipping: { destination: string; courier: string; service: string };
  items: Array<{ productId: string; color?: string; size: string; quantity: number }>;
}, customerToken?: string) {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/v1/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(customerToken ? { Authorization: `Bearer ${customerToken}` } : {})
    },
    body: JSON.stringify(orderPayload)
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Pesanan gagal dikirim. Silakan coba lagi.');
  if (!result.data?.orderNumber) throw new Error('Respons pesanan tidak valid. Hubungi toko sebelum mencoba lagi.');
  return result;
}

