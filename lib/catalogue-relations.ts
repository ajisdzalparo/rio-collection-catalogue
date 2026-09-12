import type { JournalArticle, JournalSummary, Product, ProductSummary } from '@/types/catalogue.types';

type ProductWithJournalLinks = Product & {
  journalLinks?: Array<{ journal: JournalSummary }>;
};

type JournalWithProductLinks = JournalArticle & {
  productLinks?: Array<{ product: ProductSummary }>;
};

export function mapProductRelations(product: ProductWithJournalLinks): Product {
  const { journalLinks = [], ...data } = product;
  return {
    ...data,
    journalIds: journalLinks.map((link) => link.journal.id),
    journals: journalLinks.map((link) => link.journal)
  };
}

export function mapJournalRelations(journal: JournalWithProductLinks): JournalArticle {
  const { productLinks = [], ...data } = journal;
  return {
    ...data,
    relatedProducts: productLinks.map((link) => link.product)
  };
}
