import { NextResponse } from 'next/server';
import { verifyOtp, OtpError } from '@/lib/otp';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, code, type = 'ORDER' } = body;

    if (!email || !code) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Email dan kode OTP wajib diisi.' },
        { status: 400 }
      );
    }

    // verify without consuming if caller wants to check before final submit,
    // or with consume=false for preview
    await verifyOtp({ email, code, type, consume: false });

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: { verified: true, email }
    });
  } catch (error) {
    if (error instanceof OtpError) {
      return NextResponse.json(
        { code: error.status, status: 'error', message: error.message },
        { status: error.status }
      );
    }
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Verifikasi OTP gagal. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
