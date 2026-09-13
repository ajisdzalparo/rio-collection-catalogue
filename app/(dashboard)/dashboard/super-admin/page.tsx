import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PlatformFinancePage } from '@/features/platform-finance/components/platform-finance-page';
import { getSuperAdminUser } from '@/lib/auth/authorization';

export const metadata: Metadata = {
  title: 'Super Admin Finance',
  description: 'Kontrol komisi penjualan berdasarkan persentase atau nominal per transaksi.'
};

export const dynamic = 'force-dynamic';

export default async function SuperAdminFinanceRoute() {
  const user = await getSuperAdminUser();
  if (!user) {
    redirect('/forbidden');
  }

  return <PlatformFinancePage />;
}
