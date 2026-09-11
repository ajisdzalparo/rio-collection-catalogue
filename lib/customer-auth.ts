import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const CUSTOMER_JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || process.env.JWT_SECRET || 'rio-customer-secret-key-2026';
export const CUSTOMER_TOKEN_COOKIE = 'customer_token';

export interface CustomerPayload {
  customerId: string;
  email: string;
}

export function signCustomerToken(payload: CustomerPayload): string {
  return jwt.sign(payload, CUSTOMER_JWT_SECRET, { expiresIn: '30d' });
}

export function verifyCustomerToken(token: string): CustomerPayload | null {
  try {
    return jwt.verify(token, CUSTOMER_JWT_SECRET) as CustomerPayload;
  } catch {
    return null;
  }
}

export async function getCustomerFromRequest(request?: Request) {
  let token: string | undefined;

  if (request) {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      const cookieHeader = request.headers.get('cookie') || request.headers.get('Cookie');
      if (cookieHeader) {
        const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${CUSTOMER_TOKEN_COOKIE}=([^;]*)`));
        if (match) {
          token = decodeURIComponent(match[1]);
        }
      }
    }
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(CUSTOMER_TOKEN_COOKIE)?.value;
    } catch {
      // outside request context or next/headers not available
    }
  }

  if (!token) return null;

  const payload = verifyCustomerToken(token);
  if (!payload || !payload.customerId) return null;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: payload.customerId }
    });
    return customer;
  } catch {
    return null;
  }
}
