import type { Metadata } from 'next';
import { RoleEditPage } from '@/features/users/components/role-edit-page';

interface RoleEditRouteProps {
  params: Promise<{ roleName: string }>;
}

export async function generateMetadata({ params }: RoleEditRouteProps): Promise<Metadata> {
  const { roleName } = await params;
  const decodedRoleName = decodeURIComponent(roleName);

  return {
    title: `Edit Master Role ${decodedRoleName}`,
    description: 'Atur nama, deskripsi, dan hak akses menu untuk master role.'
  };
}

export default async function RoleEditRoute({ params }: RoleEditRouteProps) {
  const { roleName } = await params;
  return <RoleEditPage roleName={decodeURIComponent(roleName)} />;
}
