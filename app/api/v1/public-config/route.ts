import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const recaptchaSiteKey =
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || process.env.RECAPTCHA_SITE_KEY || '';

  return NextResponse.json({
    recaptchaSiteKey
  });
}
