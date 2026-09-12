import type { Metadata } from 'next';
import Link from 'next/link';
import { getProducts } from '@/lib/api';
import { CatalogueClientView } from '@/components/catalogue/catalogue-client-view';

export const metadata: Metadata = {
  title: 'Catalogue',
  description: 'Explore the latest limited-edition T-shirt designs and drops from RIO COLLECTION.'
};

export const revalidate = 60;

export default async function CataloguePage() {
  const products = await getProducts();

  return (
    <>
      {/* Header */}
      <section className="mx-auto max-w-350 px-4 md:px-16 pt-8 md:pt-12 pb-6">
        {/* Breadcrumbs */}
        <nav
          className="mb-4 font-hanken text-[11px] uppercase tracking-[0.08em] text-(--cat-on-surface-variant)"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-(--cat-on-surface) transition-colors duration-150">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-(--cat-on-surface) font-semibold">Catalogue</span>
        </nav>

        {/* Title */}
        <h1 className="font-eb-garamond text-[36px] md:text-[56px] font-normal leading-tight text-(--cat-on-surface)">
          Catalogue
        </h1>
        <p className="mt-2 font-hanken text-[14px] md:text-[16px] text-(--cat-on-surface-variant)">
          Explore the latest limited-edition T-shirt designs.
        </p>
      </section>

      {/* Interactive Filter & Product Grid */}
      <CatalogueClientView products={products} />
    </>
  );
}
