export type ProductStatus = 'AVAILABLE' | 'SOLD_OUT' | 'COMING_SOON';

export type ProductCategory = 'heavy-weight' | 'graphic-edition' | 'core-silhouette';

export interface ProductVariant {
  size: string;
  inStock: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  color: string;
  colorHex: string;
  status: ProductStatus;
  category: ProductCategory;
  imageUrl: string;
  images: string[];
  description: string;
  edition: string;
  variants: ProductVariant[];
}

export interface ArchiveCollection {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  status: 'SOLD_OUT';
  description: string;
}

export type JournalCategory = 'PROSES KREATIF' | 'CULTURE' | 'PROCESS' | 'DESIGN' | 'MATERIAL STUDY';

export interface JournalArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: JournalCategory;
  date: string;
  author: string;
  imageUrl: string;
  content: string[];
  pullQuote?: string;
  relatedProductSlug?: string;
}

export interface Testimony {
  id: string;
  imageUrl: string;
  alt: string;
}
