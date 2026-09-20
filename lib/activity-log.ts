import type { Prisma } from '@prisma/client';
import type { AuthCookieUser } from '@/lib/auth/roles';
import { prisma } from '@/lib/prisma';

export type ActivityAction =
  | 'LOGIN'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'PASSWORD_RESET'
  | 'STATUS_CHANGE'
  | 'SETTINGS_UPDATE';

export type ActivityModule =
  | 'AUTH'
  | 'USERS'
  | 'ORDERS'
  | 'PRODUCTS'
  | 'JOURNALS'
  | 'SETTINGS'
  | 'FINANCE'
  | 'REFERRALS'
  | 'RBAC';

interface RecordActivityInput {
  actor: AuthCookieUser | null;
  action: ActivityAction;
  module: ActivityModule;
  description: string;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  request?: Request;
}

function getRequestContext(request?: Request) {
  if (!request) return {};

  // Only read client-IP forwarding headers. Never fall back to a server socket
  // address, because that would record the CMS host instead of the user device.
  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-client-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0];

  return {
    ipAddress: clientIp?.trim() || null,
    userAgent: request.headers.get('user-agent')?.slice(0, 500) || null
  };
}

export async function recordActivity({
  actor,
  action,
  module,
  description,
  entityType,
  entityId,
  metadata,
  request
}: RecordActivityInput): Promise<void> {
  if (!actor) return;

  try {
    await prisma.activityLog.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action,
        module,
        description,
        entityType,
        entityId,
        metadata,
        ...getRequestContext(request)
      }
    });
  } catch (error) {
    // Audit logging must not make a successful CMS mutation fail.
    console.error('Failed to record activity log:', error);
  }
}
