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
 * Fetches all customer testimonies from native backend API.
 */
export async function getTestimonies(): Promise<Testimony[]> {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/v1/testimonies`, {
      next: { revalidate: 30 }
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();
    return json.data || json || [];
  } catch (error) {
    console.error('Testimonies fetch failed:', error);
    return [];
  }
}

/**
 * Fetches all products from native backend API.
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/v1/products`, {
      next: { revalidate: 30 }
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();
    return json.data || json || [];
  } catch (error) {
    console.error('Products fetch failed:', error);
    return [];
  }
}

/**
 * Fetches product by slug.
 */
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug);
}

/**
 * Fetches all archives from native backend API.
 */
export async function getArchives(): Promise<ArchiveCollection[]> {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/v1/archives`, {
      next: { revalidate: 30 }
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();
    return json.data || json || [];
  } catch (error) {
    console.error('Archives fetch failed:', error);
    return [];
  }
}

/**
 * Fetches all journal articles from native backend API.
 */
export async function getJournals(): Promise<JournalArticle[]> {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/v1/journals`, {
      next: { revalidate: 30 }
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();
    return json.data || json || [];
  } catch (error) {
    console.error('Journals fetch failed:', error);
    return [];
  }
}

/**
 * Fetches journal article by slug.
 */
export async function getJournalBySlug(slug: string): Promise<JournalArticle | undefined> {
  const journals = await getJournals();
  return journals.find((j) => j.slug === slug);
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
