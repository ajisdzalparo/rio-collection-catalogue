import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendOtpEmail } from '@/lib/email';

export class OtpError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400
  ) {
    super(message);
  }
}

export function generateOtpCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

interface RequestOtpParams {
  email: string;
  type?: 'ORDER' | 'LOGIN';
}

export async function requestOtp({ email, type = 'ORDER' }: RequestOtpParams) {
  const normalizedEmail = email.trim().toLowerCase();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    throw new OtpError('Alamat email tidak valid.', 400);
  }

  // Rate limiting: check recent OTP within 60 seconds
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const recentOtp = await prisma.otpVerification.findFirst({
    where: {
      email: normalizedEmail,
      createdAt: { gte: oneMinuteAgo }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (recentOtp) {
    const waitSeconds = Math.ceil((recentOtp.createdAt.getTime() + 60000 - Date.now()) / 1000);
    throw new OtpError(
      `Mohon tunggu ${waitSeconds > 0 ? waitSeconds : 1} detik sebelum meminta kode OTP baru.`,
      429
    );
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

  // Invalidate any existing unused OTPs for this email and type
  await prisma.otpVerification.updateMany({
    where: {
      email: normalizedEmail,
      type,
      isUsed: false
    },
    data: {
      isUsed: true
    }
  });

  // Save new OTP
  await prisma.otpVerification.create({
    data: {
      email: normalizedEmail,
      code,
      type,
      expiresAt
    }
  });

  // Get Store Name if available
  let storeName = 'RIO COLLECTION';
  try {
    const settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } });
    if (settings?.storeName) {
      storeName = settings.storeName;
    }
  } catch {}

  // Send email
  const sendResult = await sendOtpEmail({
    to: normalizedEmail,
    code,
    type,
    storeName
  });

  return {
    success: true,
    email: normalizedEmail,
    expiresAt,
    isDevMode: sendResult.isDevMode,
    message: sendResult.isDevMode
      ? `[DEV MODE] Kode OTP ${code} (cek terminal / gunakan kode ini)`
      : 'Kode OTP telah dikirim ke email Anda. Silakan periksa inbox atau folder spam.'
  };
}

interface VerifyOtpParams {
  email: string;
  code: string;
  type?: 'ORDER' | 'LOGIN';
  consume?: boolean; // whether to mark isUsed=true
}

export async function verifyOtp({
  email,
  code,
  type = 'ORDER',
  consume = true
}: VerifyOtpParams): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = code.trim();

  if (!normalizedCode || normalizedCode.length !== 6) {
    throw new OtpError('Format kode OTP tidak valid (harus 6 digit).', 400);
  }

  const record = await prisma.otpVerification.findFirst({
    where: {
      email: normalizedEmail,
      type,
      isUsed: false
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!record) {
    throw new OtpError(
      'Kode OTP tidak ditemukan atau sudah digunakan. Silakan minta kode baru.',
      400
    );
  }

  if (new Date() > record.expiresAt) {
    throw new OtpError('Kode OTP telah kedaluwarsa. Silakan minta kode baru.', 400);
  }

  if (record.attempts >= 5) {
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { isUsed: true }
    });
    throw new OtpError('Terlalu banyak percobaan gagal. Kode OTP hangus. Minta kode baru.', 400);
  }

  if (record.code !== normalizedCode) {
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } }
    });
    throw new OtpError('Kode OTP salah. Silakan periksa kembali email Anda.', 400);
  }

  if (consume) {
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { isUsed: true }
    });
  }

  return true;
}
