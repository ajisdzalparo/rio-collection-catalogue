import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyOtp, OtpError } from '@/lib/otp';
import { hashPassword } from '@/lib/password';
import { passwordResetConfirmSchema } from '@/lib/password-reset-schema';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const parsed = passwordResetConfirmSchema.safeParse(await request.json().catch(() => null));
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
      throw new OtpError('Kode OTP tidak valid atau sudah kedaluwarsa.', 400);
    }

    await verifyOtp({
      email: parsed.data.email,
      code: parsed.data.otpCode,
      type: 'PASSWORD_RESET',
      consume: true
    });

    const passwordHash = await hashPassword(parsed.data.newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    return NextResponse.json({
      code: 200,
      status: 'success',
      message: 'Kata sandi berhasil diatur ulang. Silakan masuk dengan kata sandi baru.'
    });
  } catch (error) {
    if (error instanceof OtpError) {
      return NextResponse.json(
        { code: error.status, status: 'error', message: error.message },
        { status: error.status }
      );
    }
    console.error('Error confirming password reset:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Kata sandi gagal diatur ulang.' },
      { status: 500 }
    );
  }
}
