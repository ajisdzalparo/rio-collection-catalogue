import type { Product, ArchiveCollection, JournalArticle, Testimony } from '@/types/catalogue.types';

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
      include: {
        variants: {
          select: {
            size: true,
            inStock: true,
            stock: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return products as unknown as Product[];
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
      where: { slug },
      include: {
        variants: {
          select: {
            size: true,
            inStock: true,
            stock: true
          }
        }
      }
    });
    return (product as unknown as Product) || undefined;
  } catch (error) {
    console.error(`Server getProductBySlug failed for ${slug}:`, error);
    return undefined;
  }
}

/**
 * Fetches all archives safely for both Client and Server environments.
 */
export async function getArchives(): Promise<ArchiveCollection[]> {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/v1/archives');
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || json || [];
    } catch (error) {
      console.error('Browser archives fetch failed:', error);
      return [];
    }
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    const archives = await prisma.archive.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return archives as unknown as ArchiveCollection[];
  } catch (error) {
    console.error('Server archives fetch failed:', error);
    return [];
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
      orderBy: { createdAt: 'desc' }
    });
    return journals as unknown as JournalArticle[];
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
      where: { slug }
    });
    return (journal as unknown as JournalArticle) || undefined;
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
  whatsapp: string;
  address: string;
  items: Array<{ productId: string; size: string; quantity: number }>;
}) {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/v1/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload)
  });
  if (!res.ok) throw new Error(`Order submission error: ${res.status}`);
  return await res.json();
}
