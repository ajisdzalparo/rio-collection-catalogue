export const SUPER_ADMIN_ROLE = 'Super Admin';
export const OWNER_ROLE = 'Owner';

export function normalizeRoleName(role?: string | null): string {
  return (role || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isSuperAdminRole(role?: string | null): boolean {
  return normalizeRoleName(role) === normalizeRoleName(SUPER_ADMIN_ROLE);
}

export function isOwnerRole(role?: string | null): boolean {
  return normalizeRoleName(role) === normalizeRoleName(OWNER_ROLE);
}

export function canViewActivityLogs(role?: string | null): boolean {
  return isSuperAdminRole(role) || isOwnerRole(role);
}

export interface AuthCookieUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export function parseAuthCookieUser(rawValue?: string): AuthCookieUser | null {
  if (!rawValue) return null;

  try {
    const decoded = decodeURIComponent(rawValue);
    const parsed: unknown = JSON.parse(decoded);
    if (!parsed || typeof parsed !== 'object') return null;

    const candidate = parsed as Record<string, unknown>;
    if (
      typeof candidate.id !== 'string' ||
      typeof candidate.name !== 'string' ||
      typeof candidate.email !== 'string' ||
      typeof candidate.role !== 'string' ||
      typeof candidate.status !== 'string'
    ) {
      return null;
    }

    return {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      role: candidate.role,
      status: candidate.status
    };
  } catch {
    return null;
  }
}
