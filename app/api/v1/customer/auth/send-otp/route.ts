import { NextResponse } from 'next/server';
import { requestOtp, OtpError } from '@/lib/otp';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit('customer-otp-send-ip', ip, {
      windowMs: 60_000,
      maxRequests: 5
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          code: 429,
          status: 'error',
          message: `Terlalu banyak permintaan OTP dari perangkat Anda. Silakan coba lagi dalam ${rateLimit.retryAfterSeconds} detik.`
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Alamat email wajib diisi.' },
        { status: 400 }
      );
    }

    const result = await requestOtp({ email, type: 'LOGIN' });
    return NextResponse.json({
      code: 200,
      status: 'success',
      data: result
    });
  } catch (error) {
    if (error instanceof OtpError) {
      return NextResponse.json(
        { code: error.status, status: 'error', message: error.message },
        { status: error.status }
      );
    }
    console.error('Error sending login OTP:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal mengirim kode OTP login.' },
      { status: 500 }
    );
  }
}
