import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
const HASH_PREFIX = 'scrypt';

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${HASH_PREFIX}$${salt}$${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [prefix, salt, hashHex] = storedHash.split('$');
  if (prefix !== HASH_PREFIX || !salt || !hashHex) return false;

  try {
    const storedKey = Buffer.from(hashHex, 'hex');
    if (storedKey.length !== KEY_LENGTH) return false;
    const suppliedKey = (await scryptAsync(password, salt, storedKey.length)) as Buffer;
    return timingSafeEqual(storedKey, suppliedKey);
  } catch {
    return false;
  }
}
