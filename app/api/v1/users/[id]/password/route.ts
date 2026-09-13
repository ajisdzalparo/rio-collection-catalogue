import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/authorization';
import { isSuperAdminRole } from '@/lib/auth/roles';
import { recordActivity } from '@/lib/activity-log';
import { hashPassword } from '@/lib/password';
import { adminResetPasswordSchema } from '@/lib/password-reset-schema';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getAuthenticatedUser();
  if (!actor) {
    return NextResponse.json(
      { code: 401, status: 'error', message: 'Sesi login tidak valid.' },
      { status: 401 }
    );
  }

  const { id } = await params;
  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true }
  });
  if (!target) {
    return NextResponse.json(
      { code: 404, status: 'error', message: 'User tidak ditemukan.' },
      { status: 404 }
    );
  }

  if (isSuperAdminRole(target.role) && !isSuperAdminRole(actor.role)) {
    return NextResponse.json(
      {
        code: 403,
        status: 'error',
        message: 'Kata sandi Super Admin hanya dapat diubah oleh Super Admin.'
      },
      { status: 403 }
    );
  }

  const parsed = adminResetPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { code: 400, status: 'error', message: parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }

  try {
    const passwordHash = await hashPassword(parsed.data.newPassword);
    await prisma.user.update({ where: { id }, data: { passwordHash } });
    await recordActivity({
      actor,
      action: 'PASSWORD_RESET',
      module: 'USERS',
      description: `Mereset kata sandi akun ${target.name} (${target.email}).`,
      entityType: 'User',
      entityId: target.id,
      request
    });

    return NextResponse.json({
      code: 200,
      status: 'success',
      message: 'Kata sandi pengguna berhasil diperbarui.'
    });
  } catch (error) {
    console.error('Error resetting user password:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal memperbarui kata sandi pengguna.' },
      { status: 500 }
    );
  }
}
