import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catalogue',
  description:
    'Explore the latest limited-edition T-shirt designs from RIO COLLECTION. Browse the current collection and archival past drops.',
  openGraph: {
    title: 'Catalogue — RIO COLLECTION',
    description:
      'Explore the latest limited-edition T-shirt designs.',
  },
};

export default function CatalogueListingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
