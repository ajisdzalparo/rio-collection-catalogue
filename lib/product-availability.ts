interface StockVariant {
  size: string;
  stock?: number;
  inStock: boolean;
}

interface StockProduct {
  status: string;
  stockMode?: string;
  stock?: number;
  variants: StockVariant[];
}

/** One availability calculation for CMS, catalogue, and checkout. */
export function normalizeProductAvailability<T extends StockProduct>(product: T): T {
  const unlimited = product.stockMode === 'ALWAYS_AVAILABLE';
  const variants = (product.variants || []).map((variant) => {
    const stock = Math.max(0, variant.stock ?? (variant.inStock ? 10 : 0));
    return { ...variant, stock, inStock: unlimited || stock > 0 };
  });
  const stock = variants.reduce((sum, variant) => sum + variant.stock, 0);
  const status = !unlimited && stock === 0 && product.status === 'AVAILABLE'
    ? 'SOLD_OUT'
    : product.status;
  return { ...product, stockMode: product.stockMode ?? 'QUANTITY', stock, status, variants };
}

export function isOrderableStatus(status: string): boolean {
  return status === 'AVAILABLE' || status === 'PRE_ORDER';
}
