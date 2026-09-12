import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requestOtp, OtpError } from '@/lib/otp';
import { passwordResetRequestSchema } from '@/lib/password-reset-schema';

export const dynamic = 'force-dynamic';

const genericMessage =
  'Jika email terdaftar dan aktif, kode OTP reset telah dikirim. Periksa inbox atau folder spam.';

export async function POST(request: Request) {
  const parsed = passwordResetRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { code: 400, status: 'error', message: parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, status: true }
    });

    if (!user || user.status !== 'active') {
      return NextResponse.json({
        code: 200,
        status: 'success',
        data: { email: parsed.data.email },
        message: genericMessage
      });
    }

    const result = await requestOtp({
      email: parsed.data.email,
      type: 'PASSWORD_RESET'
    });

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: result,
      message: result.isDevMode ? result.message : genericMessage
    });
  } catch (error) {
    if (error instanceof OtpError) {
      return NextResponse.json(
        { code: error.status, status: 'error', message: error.message },
        { status: error.status }
      );
    }
    console.error('Error requesting password reset:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Permintaan reset kata sandi gagal.' },
      { status: 500 }
    );
  }
}
