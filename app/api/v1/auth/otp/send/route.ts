import { NextResponse } from 'next/server';
import { requestOtp, OtpError } from '@/lib/otp';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, type = 'ORDER' } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Alamat email wajib diisi.' },
        { status: 400 }
      );
    }

    const result = await requestOtp({ email, type });
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
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal mengirim kode OTP. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
