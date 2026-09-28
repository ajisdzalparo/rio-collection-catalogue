import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { authorizeUserWithPermission } from '@/lib/auth/authorization';
import { isSuperAdminRole } from '@/lib/auth/roles';
import { recordActivity } from '@/lib/activity-log';
import { hashPassword } from '@/lib/password';

export async function GET(request: Request) {
  try {
    const auth = await authorizeUserWithPermission('users.view');
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || searchParams.get('q')?.trim() || '';
    const roleParam = searchParams.get('role')?.trim() || '';
    const statusParam = searchParams.get('status')?.trim() || '';
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize') || searchParams.get('limit');

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (roleParam) {
      where.role = roleParam;
    }

    if (statusParam) {
      where.status = statusParam;
    }

    const isPaginated = Boolean(pageParam || pageSizeParam);
    const page = Math.max(1, parseInt(pageParam || '1', 10) || 1);
    const pageSize = Math.max(1, parseInt(pageSizeParam || '10', 10) || 10);
    const skip = isPaginated ? (page - 1) * pageSize : undefined;
    const take = isPaginated ? pageSize : undefined;

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: users,
      meta: {
        page: isPaginated ? page : 1,
        pageSize: isPaginated ? pageSize : total,
        total,
        totalPages: isPaginated ? Math.max(1, Math.ceil(total / pageSize)) : 1
      }
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
    const auth = await authorizeUserWithPermission('users.manage');
    if (!auth.success) return auth.response;
    const authenticatedUser = auth.user;

    const body = await request.json();
    const { name, email, role, status, password } = body;

    if (!name || !email) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Nama dan email wajib diisi.' },
        { status: 400 }
      );
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });
    if (existingEmail) {
      return NextResponse.json(
        { code: 409, status: 'error', message: 'Email sudah digunakan oleh akun lain.' },
        { status: 409 }
      );
    }

    if (isSuperAdminRole(role) && !isSuperAdminRole(authenticatedUser.role)) {
      return NextResponse.json(
        {
          code: 403,
          status: 'error',
          message: 'Hanya Super Admin yang dapat menambahkan role Super Admin.'
        },
        { status: 403 }
      );
    }

    const passwordHash = password ? await hashPassword(password) : undefined;

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role || 'Admin',
        status: status || 'active',
        ...(passwordHash && { passwordHash })
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

