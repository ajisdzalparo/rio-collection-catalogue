// In-memory sliding window rate limiter with auto-cleanup

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

const rateLimitStores = new Map<string, Map<string, { count: number; expiresAt: number }>>();

export function checkRateLimit(
  namespace: string,
  identifier: string,
  options: RateLimitOptions = { windowMs: 60_000, maxRequests: 5 },
  now = Date.now()
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  let store = rateLimitStores.get(namespace);
  if (!store) {
    store = new Map();
    rateLimitStores.set(namespace, store);
  }

  // Periodic cleanup if store grows
  if (store.size > 5000) {
    for (const [key, record] of store.entries()) {
      if (record.expiresAt <= now) {
        store.delete(key);
      }
    }
  }

  const existing = store.get(identifier);
  if (!existing || existing.expiresAt <= now) {
    store.set(identifier, { count: 1, expiresAt: now + options.windowMs });
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      retryAfterSeconds: Math.ceil(options.windowMs / 1000)
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, options.maxRequests - existing.count);
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.expiresAt - now) / 1000));

  if (existing.count > options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds
    };
  }

  return {
    allowed: true,
    remaining,
    retryAfterSeconds
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
