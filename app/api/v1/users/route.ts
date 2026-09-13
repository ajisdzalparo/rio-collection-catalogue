import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth/authorization';
import { isSuperAdminRole } from '@/lib/auth/roles';
import { recordActivity } from '@/lib/activity-log';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({
      code: 200,
      status: 'success',
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedUser();
    if (!authenticatedUser) {
      return NextResponse.json(
        { code: 401, status: 'error', message: 'Sesi login tidak valid.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, role, status } = body;

    if (isSuperAdminRole(role) && !isSuperAdminRole(authenticatedUser.role)) {
      return NextResponse.json(
        { code: 403, status: 'error', message: 'Hanya Super Admin yang dapat menambahkan role Super Admin.' },
        { status: 403 }
      );
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role: role || 'Admin',
        status: status || 'active'
      }
    });

    await recordActivity({
      actor: authenticatedUser,
      action: 'CREATE',
      module: 'USERS',
      description: `Menambahkan akun ${newUser.name} (${newUser.email}).`,
      entityType: 'User',
      entityId: newUser.id,
      metadata: { role: newUser.role, status: newUser.status },
      request
    });

    return NextResponse.json({
      code: 201,
      status: 'success',
      data: newUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      {
        code: 500,
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to create user'
      },
      { status: 500 }
    );
  }
}
