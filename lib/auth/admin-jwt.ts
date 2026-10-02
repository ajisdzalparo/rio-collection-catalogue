import { SignJWT, jwtVerify } from 'jose';
import type { AuthCookieUser } from './roles';

const JWT_SECRET = process.env.JWT_SECRET || 'rio-collection-default-super-secret-jwt-key-2026';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function signAdminJwt(user: AuthCookieUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

export async function verifyAdminJwt(token: string): Promise<AuthCookieUser | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey);
    if (
      typeof payload.id !== 'string' ||
      typeof payload.name !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.role !== 'string' ||
      typeof payload.status !== 'string'
    ) {
      return null;
    }

    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      status: payload.status
    };
  } catch {
    return null;
  }
}
