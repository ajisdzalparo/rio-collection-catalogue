import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth/authorization';
import { isSuperAdminRole } from '@/lib/auth/roles';
import { recordActivity } from '@/lib/activity-log';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, role, status } = body;
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return NextResponse.json(
        { code: 401, status: 'error', message: 'Sesi login tidak valid.' },
        { status: 401 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      return NextResponse.json(
        { code: 404, status: 'error', message: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    if (isSuperAdminRole(existingUser.role) && !isSuperAdminRole(authenticatedUser.role)) {
      return NextResponse.json(
        { code: 403, status: 'error', message: 'Akun Super Admin dilindungi dan tidak dapat diubah.' },
        { status: 403 }
      );
    }

    if (existingUser.id === authenticatedUser.id && status === 'inactive') {
      return NextResponse.json(
        { code: 403, status: 'error', message: 'Akun yang sedang digunakan tidak dapat dinonaktifkan.' },
        { status: 403 }
      );
    }

    if (isSuperAdminRole(existingUser.role) && role !== undefined && !isSuperAdminRole(role)) {
      return NextResponse.json(
        { code: 403, status: 'error', message: 'Role akun Super Admin tidak dapat diturunkan.' },
        { status: 403 }
      );
    }

    if (isSuperAdminRole(role) && !isSuperAdminRole(authenticatedUser.role)) {
      return NextResponse.json(
        { code: 403, status: 'error', message: 'Hanya Super Admin yang dapat menetapkan role Super Admin.' },
        { status: 403 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
        ...(status && { status })
      }
    });

    await recordActivity({
      actor: authenticatedUser,
      action: status !== undefined && status !== existingUser.status ? 'STATUS_CHANGE' : 'UPDATE',
      module: 'USERS',
      description: `Memperbarui akun ${updatedUser.name} (${updatedUser.email}).`,
      entityType: 'User',
      entityId: updatedUser.id,
      metadata: {
        before: { role: existingUser.role, status: existingUser.status },
        after: { role: updatedUser.role, status: updatedUser.status },
        changedFields: Object.keys(body)
      },
      request
    });

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return NextResponse.json(
        { code: 401, status: 'error', message: 'Sesi login tidak valid.' },
        { status: 401 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      return NextResponse.json(
        { code: 404, status: 'error', message: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    if (existingUser.id === authenticatedUser.id) {
      return NextResponse.json(
        { code: 403, status: 'error', message: 'Akun yang sedang digunakan tidak dapat dihapus.' },
        { status: 403 }
      );
    }

    if (isSuperAdminRole(existingUser.role) && !isSuperAdminRole(authenticatedUser.role)) {
      return NextResponse.json(
        { code: 403, status: 'error', message: 'Akun Super Admin hanya dapat dihapus oleh Super Admin.' },
        { status: 403 }
      );
    }

    await prisma.user.delete({
      where: { id }
    });

    await recordActivity({
      actor: authenticatedUser,
      action: 'DELETE',
      module: 'USERS',
      description: `Menghapus akun ${existingUser.name} (${existingUser.email}).`,
      entityType: 'User',
      entityId: existingUser.id,
      metadata: { role: existingUser.role, status: existingUser.status },
      request
    });
    return NextResponse.json({
      code: 200,
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
