interface StockVariant {
  size: string;
  stock?: number;
  inStock: boolean;
}

interface StockProduct {
  status: string;
  stockMode?: string;
  stock?: number;
  releaseDate?: string | Date | null;
  variants: StockVariant[];
}

/** One availability calculation for CMS, catalogue, and checkout. */
export function normalizeProductAvailability<T extends StockProduct>(product: T): T {
  const isReleaseDue =
    product.status === 'COMING_SOON' &&
    Boolean(product.releaseDate) &&
    new Date(product.releaseDate as string | Date).getTime() <= Date.now();

  const effectiveStatus = isReleaseDue ? 'AVAILABLE' : product.status;
  const unlimited = product.stockMode === 'ALWAYS_AVAILABLE' || effectiveStatus === 'PRE_ORDER';
  const variants = (product.variants || []).map((variant) => {
    const stock = Math.max(0, variant.stock ?? (variant.inStock ? 10 : 0));
    return { ...variant, stock, inStock: unlimited || stock > 0 };
  });
  const stock = variants.reduce((sum, variant) => sum + variant.stock, 0);
  const status =
    !unlimited && stock === 0 && effectiveStatus === 'AVAILABLE' ? 'SOLD_OUT' : effectiveStatus;
  return { ...product, stockMode: product.stockMode ?? 'QUANTITY', stock, status, variants };
}

export function isOrderableStatus(status: string): boolean {
  return status === 'AVAILABLE' || status === 'PRE_ORDER';
}

export function isArchivedProductStatus(status: string): boolean {
  return status === 'SOLD_OUT' || status === 'DISCONTINUED';
}

export function isComingSoonActive(status: string, releaseDate?: string | Date | null): boolean {
  if (status !== 'COMING_SOON') return false;
  if (!releaseDate) return true;
  return new Date(releaseDate).getTime() > Date.now();
}
