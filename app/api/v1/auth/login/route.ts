import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Email harus diisi' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Try to find user in database
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    // If user not found, create admin for seamless onboarding/demo
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: cleanEmail.split('@')[0] || 'Admin',
          email: cleanEmail,
          role: 'Super Admin',
          status: 'active'
        }
      });
    }

    if (user.status !== 'active') {
      return NextResponse.json(
        { code: 403, status: 'error', message: 'Akun Anda sedang dinonaktifkan' },
        { status: 403 }
      );
    }

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    };

    const response = NextResponse.json({
      code: 200,
      status: 'success',
      data: userData
    });

    // Set cookie
    response.cookies.set('auth_token', JSON.stringify(userData), {
      httpOnly: false, // Accessible client side for state syncing if needed
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
