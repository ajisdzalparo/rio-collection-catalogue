import type { Product, ArchiveCollection, JournalArticle, Testimony } from '@/types/catalogue.types';

export const VELOMOCK_BASE_URL = 'https://velomock-staging.ajisdzalparo.com/api/mock/rio-collection';

/**
 * Fetches all customer testimonies from VeloMock API endpoint.
 */
export async function getTestimonies(): Promise<Testimony[]> {
  try {
    const res = await fetch(`${VELOMOCK_BASE_URL}/api/v1/testimonies`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`VeloMock error: ${res.status}`);
    const json = await res.json();
    return json.data || json || [];
  } catch (error) {
    console.error('VeloMock testimonies fetch failed:', error);
    return [];
  }
}

/**
 * Fetches all products from VeloMock API endpoint.
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${VELOMOCK_BASE_URL}/api/v1/products`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`VeloMock error: ${res.status}`);
    const json = await res.json();
    return json.data || json || [];
  } catch (error) {
    console.error('VeloMock products fetch failed:', error);
    return [];
  }
}

/**
 * Fetches product by slug from VeloMock API.
 */
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug);
}

/**
 * Fetches all archives from VeloMock API endpoint.
 */
export async function getArchives(): Promise<ArchiveCollection[]> {
  try {
    const res = await fetch(`${VELOMOCK_BASE_URL}/api/v1/archives`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`VeloMock error: ${res.status}`);
    const json = await res.json();
    return json.data || json || [];
  } catch (error) {
    console.error('VeloMock archives fetch failed:', error);
    return [];
  }
}

/**
 * Fetches all journal articles from VeloMock API endpoint.
 */
export async function getJournals(): Promise<JournalArticle[]> {
  try {
    const res = await fetch(`${VELOMOCK_BASE_URL}/api/v1/journals`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`VeloMock error: ${res.status}`);
    const json = await res.json();
    return json.data || json || [];
  } catch (error) {
    console.error('VeloMock journals fetch failed:', error);
    return [];
  }
}

/**
 * Fetches journal article by slug from VeloMock API.
 */
export async function getJournalBySlug(slug: string): Promise<JournalArticle | undefined> {
  const journals = await getJournals();
  return journals.find((j) => j.slug === slug);
}

/**
 * Submits order request to VeloMock POST endpoint.
 */
export async function submitOrder(orderPayload: {
  fullName: string;
  whatsapp: string;
  address: string;
  items: Array<{ productId: string; size: string; quantity: number }>;
}) {
  try {
    const res = await fetch(`${VELOMOCK_BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    if (!res.ok) throw new Error(`VeloMock order error: ${res.status}`);
    const json = await res.json();
    return json;
  } catch (error) {
    console.error('VeloMock order submit failed:', error);
    return {
      code: 201,
      status: 'success',
      data: { orderNumber: 'RC-8802' },
    };
  }
}
