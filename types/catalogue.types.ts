export type ProductStatus =
  | 'AVAILABLE'
  | 'SOLD_OUT'
  | 'COMING_SOON'
  | 'PRE_ORDER'
  | 'DISCONTINUED';
export type StockMode = 'QUANTITY' | 'ALWAYS_AVAILABLE';

export interface ProductVariant {
  size: string;
  inStock: boolean;
  stock?: number;
}

export interface MaterialsAndCare {
  fabric?: string;
  treatment?: string;
  origin?: string;
  careInstruction?: string;
}

export interface ProductImage {
  url: string;
  isDetail: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  hpp?: number;
  stock?: number;
  stockMode?: StockMode;
  color: string;
  colorHex: string;
  colors?: string[];
  colorHexes?: string[];
  status: ProductStatus;
  category: string;
  imageUrl: string;
  images: string[];
  imageDetails?: ProductImage[];
  description: string;
  storyTitle?: string;
  storyText?: string;
  edition: string;
  variants: ProductVariant[];
  materialsAndCare?: MaterialsAndCare;
}

export interface ArchiveCollection {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  status: 'SOLD_OUT';
  description: string;
}

export type JournalCategory =
  | 'PROSES KREATIF'
  | 'CULTURE'
  | 'PROCESS'
  | 'DESIGN'
  | 'MATERIAL STUDY';

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
  contentHtml?: string;
  pullQuote?: string;
  relatedProductSlug?: string;
}

export interface Testimony {
  id: string;
  imageUrl: string;
  alt: string;
  clientName?: string;
  status?: 'ACTIVE' | 'HIDDEN';
  createdAt?: string;
}
