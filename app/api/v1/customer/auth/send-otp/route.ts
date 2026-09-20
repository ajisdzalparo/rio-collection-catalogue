import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
    const { email, mode } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Alamat email wajib diisi.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check customer existence if mode is specified
    if (mode === 'LOGIN' || mode === 'REGISTER') {
      const existingCustomer = await prisma.customer.findUnique({
        where: { email: normalizedEmail }
      });

      if (mode === 'LOGIN' && !existingCustomer) {
        return NextResponse.json(
          {
            code: 404,
            status: 'error',
            message: 'Email belum terdaftar. Silakan pilih tab "Daftar Baru" terlebih dahulu.'
          },
          { status: 404 }
        );
      }

      if (mode === 'REGISTER' && existingCustomer) {
        return NextResponse.json(
          {
            code: 409,
            status: 'error',
            message: 'Email sudah terdaftar. Silakan pilih tab "Masuk" untuk login.'
          },
          { status: 409 }
        );
      }
    }

    const result = await requestOtp({ email: normalizedEmail, type: 'LOGIN' });
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
