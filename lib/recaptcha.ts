export class CaptchaError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

export async function verifyRecaptcha(token: string): Promise<void> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    throw new CaptchaError('Checkout belum siap. Hubungi toko untuk bantuan pemesanan.', 503);
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
