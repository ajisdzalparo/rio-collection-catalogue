import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catalogue',
  description:
    'Explore the latest limited-edition T-shirt designs from RIO COLLECTION. Browse the current collection and archival past drops.',
  openGraph: {
    title: 'Catalogue — RIO COLLECTION',
    description:
      'Explore the latest limited-edition T-shirt designs.',
    images: [
      {
        url: '/ms-icon-310x310.png',
        width: 310,
        height: 310,
        alt: 'RIO COLLECTION Catalogue',
      },
    ],
  },
};

export default function CatalogueListingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
