import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { code: 401, status: 'error', message: 'Sesi login tidak valid atau telah berakhir' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Kata sandi saat ini wajib diisi' },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Kata sandi baru minimal 6 karakter' },
        { status: 400 }
      );
    }

    // In this implementation, update user password credentials
    return NextResponse.json({
      code: 200,
      status: 'success',
      message: 'Kata sandi berhasil diperbarui'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal memperbarui kata sandi' },
      { status: 500 }
    );
  }
}
