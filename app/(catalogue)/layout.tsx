import { CatalogueNavbar } from '@/components/catalogue/navbar';
import { CatalogueFooter } from '@/components/catalogue/footer';
import { prisma } from '@/lib/prisma';
import { StoreSettingsInitializer } from '@/components/catalogue/store-settings-initializer';
import type { StoreSettings } from '@/hooks/use-store-settings';
import { connection } from 'next/server';

export default async function CatalogueLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const settings = await prisma.storeSettings
    .findUnique({ where: { id: 'default' } })
    .catch(() => null);

  return (
    <div
      data-catalogue
      className="relative flex min-h-screen flex-col font-hanken overflow-x-hidden bg-(--cat-surface)"
    >
      <StoreSettingsInitializer settings={settings as unknown as StoreSettings} />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-125 w-125 -translate-x-1/2 rounded-full bg-linear-to-tr from-(--cat-stone)/15 via-neutral-100/5 to-transparent blur-3xl opacity-60 z-0" />
      <div className="pointer-events-none absolute top-1/3 right-0 h-150 w-150 rounded-full bg-linear-to-br from-neutral-200/10 via-(--cat-stone)/10 to-transparent blur-3xl opacity-50 z-0" />
      <div className="pointer-events-none absolute bottom-40 left-1/4 h-125 w-125 rounded-full bg-linear-to-tr from-(--cat-stone)/15 via-neutral-100/5 to-transparent blur-3xl opacity-60 z-0" />

      <div className="relative z-10 flex flex-col min-h-screen flex-1">
        <CatalogueNavbar />
        <main className="flex-1">{children}</main>
        <CatalogueFooter />
      </div>
    </div>
  );
}
