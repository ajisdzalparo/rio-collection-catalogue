import { CatalogueNavbar } from '@/components/catalogue/navbar';
import { CatalogueFooter } from '@/components/catalogue/footer';

export default function CatalogueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-catalogue className="flex min-h-screen flex-col font-[family-name:var(--font-hanken)]">
      <CatalogueNavbar />
      <main className="flex-1">{children}</main>
      <CatalogueFooter />
    </div>
  );
}
