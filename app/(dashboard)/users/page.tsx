import { redirect } from 'next/navigation';

interface UsersPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function UsersRedirectPage({ searchParams }: UsersPageProps) {
  const { tab } = await searchParams;

  if (tab === 'rbac' || tab === 'role' || tab === 'roles') {
    redirect('/manajemen-pengguna/role');
  }

  redirect('/manajemen-pengguna/user');
}
