export class CaptchaError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

export async function verifyRecaptcha(token: string): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';
  let secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    try {
      const { prisma } = await import('@/lib/prisma');
      const settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } });
      if (settings?.recaptchaSecretKey) {
        secret = settings.recaptchaSecretKey;
      }
    } catch {}
  }

  // In non-production (development / testing), bypass verification
  if (!isProduction) {
    return;
  }

  // In production, require RECAPTCHA_SECRET_KEY
  if (!secret) {
    throw new CaptchaError('Checkout belum siap. Hubungi toko untuk bantuan pemesanan.', 503);
  }

  if (!token) {
    throw new CaptchaError('CAPTCHA wajib diverifikasi sebelum memesan.', 400);
  }

  let response: Response;
  try {
    response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(10000)
    });
  } catch {
    throw new CaptchaError('Verifikasi CAPTCHA tidak tersedia. Silakan coba lagi.', 503);
  }

  if (!response.ok) throw new CaptchaError('Verifikasi CAPTCHA tidak tersedia.', 503);

  const result: unknown = await response.json();
  if (!result || typeof result !== 'object' || !('success' in result) || result.success !== true) {
    throw new CaptchaError('CAPTCHA tidak valid atau kedaluwarsa. Silakan verifikasi ulang.', 400);
  }
}
