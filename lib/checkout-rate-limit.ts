// Limit retries within each server process; CAPTCHA is also verified on every request.
const attempts = new Map<string, { count: number; expiresAt: number }>();

export function allowCheckoutAttempt(key: string, now = Date.now()): boolean {
  for (const [storedKey, value] of attempts) {
    if (value.expiresAt <= now) attempts.delete(storedKey);
  }
  const value = attempts.get(key) ?? { count: 0, expiresAt: now + 60000 };
  value.count += 1;
  if (attempts.size >= 10000 && !attempts.has(key)) return false;
  attempts.set(key, value);
  return value.count <= 5;
}
