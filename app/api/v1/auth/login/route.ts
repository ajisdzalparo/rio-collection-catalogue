import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordActivity } from '@/lib/activity-log';
import { verifyPassword } from '@/lib/password';
import { getEffectivePermissions } from '@/lib/auth/user-permissions';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';
import { signAdminJwt } from '@/lib/auth/admin-jwt';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit('admin-login', ip, {
    windowMs: 60_000,
    maxRequests: 5
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        code: 429,
        status: 'error',
        message: `Terlalu banyak percobaan login. Silakan coba lagi dalam ${rateLimit.retryAfterSeconds} detik.`
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Email harus diisi' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Kata sandi harus diisi' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return NextResponse.json(
        { code: 401, status: 'error', message: 'Email atau kata sandi tidak valid' },
        { status: 401 }
      );
    }

    if (user.status !== 'active') {
      return NextResponse.json(
        {
          code: 403,
          status: 'error',
          message: 'Akun Anda sedang dinonaktifkan. Silakan hubungi Super Admin.'
        },
        { status: 403 }
      );
    }

    // Verify password if user has passwordHash
    if (user.passwordHash) {
      const isMatch = await verifyPassword(password, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { code: 401, status: 'error', message: 'Email atau kata sandi tidak valid' },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        {
          code: 401,
          status: 'error',
          message: 'Akun ini belum memiliki kata sandi. Silakan gunakan fitur Lupa Kata Sandi untuk mengatur kata sandi.'
        },
        { status: 401 }
      );
    }

    const permissions = await getEffectivePermissions(user.role);

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      permissions
    };

    await recordActivity({
      actor: userData,
      action: 'LOGIN',
      module: 'AUTH',
      description: 'Masuk ke dashboard CMS.',
      entityType: 'User',
      entityId: user.id,
      request
    });

    const response = NextResponse.json({
      code: 200,
      status: 'success',
      data: userData
    });

    const authToken = await signAdminJwt(userData);

    // Set secure httpOnly cookie
    response.cookies.set('auth_token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal melakukan login. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
