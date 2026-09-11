import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  let recaptchaSiteKey =
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || process.env.RECAPTCHA_SITE_KEY || '';

  if (!recaptchaSiteKey) {
    try {
      const settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } });
      if (settings?.recaptchaSiteKey) {
        recaptchaSiteKey = settings.recaptchaSiteKey;
      }
    } catch {}
  }

  return NextResponse.json({
    recaptchaSiteKey
  });
}
