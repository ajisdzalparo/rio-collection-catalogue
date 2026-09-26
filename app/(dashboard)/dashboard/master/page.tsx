import { redirect } from 'next/navigation';
import { TAB_REVERSE_MAP, TAB_SLUG_MAP } from './components/master-data-page-content';

interface MasterIndexPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function MasterIndexPage({ searchParams }: MasterIndexPageProps) {
  const { tab } = await searchParams;

  if (tab) {
    const internalKey = TAB_SLUG_MAP[tab] || tab;
    const targetSlug = TAB_REVERSE_MAP[internalKey] || tab;
    redirect(`/dashboard/master/${targetSlug}`);
  }

  redirect('/dashboard/master/kategori');
}
