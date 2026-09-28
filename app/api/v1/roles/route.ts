import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeUserWithPermission } from '@/lib/auth/authorization';
import { isSuperAdminRole } from '@/lib/auth/roles';
import { recordActivity } from '@/lib/activity-log';
import { prisma } from '@/lib/prisma';

const legacyRoleSelect = {
  id: true,
  name: true,
  permissions: true,
  createdAt: true,
  updatedAt: true
} as const;

function isMissingRoleMetadataColumns(error: unknown) {
  return error instanceof Error && /description|isSystemRole|isActive|column.*does not exist/i.test(error.message);
}

function addRoleCompatibilityFields<T extends { name: string }>(role: T) {
  return {
    ...role,
    description: role.name === 'Owner'
      ? 'Pemilik toko dengan akses penuh operasional selain finance platform'
      : role.name === 'Super Admin'
        ? 'Akses tertinggi ke seluruh sistem dan finance platform'
        : null,
    isSystemRole: isSuperAdminRole(role.name),
    isActive: true
  };
}

const createRoleSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).optional(),
  permissions: z.record(z.string(), z.boolean()).default({})
});

export async function GET(request: Request) {
  const auth = await authorizeUserWithPermission('users.view');
  if (!auth.success) return auth.response;
  try {
    let roles;
    try {
      roles = await prisma.role.findMany({ orderBy: { createdAt: 'asc' } });
    } catch (error) {
      if (!isMissingRoleMetadataColumns(error)) throw error;
      const legacyRoles = await prisma.role.findMany({ select: legacyRoleSelect, orderBy: { createdAt: 'asc' } });
      roles = legacyRoles.map(addRoleCompatibilityFields);
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize') || searchParams.get('limit');

    let filtered = roles;
    if (search) {
      filtered = roles.filter((role) =>
        role.name.toLowerCase().includes(search) ||
        ('description' in role && typeof role.description === 'string' && role.description.toLowerCase().includes(search))
      );
    }

    if (!pageParam && !pageSizeParam) {
      return NextResponse.json({ code: 200, status: 'success', data: filtered });
    }

    const page = Math.max(1, parseInt(pageParam || '1', 10) || 1);
    const pageSize = Math.max(1, parseInt(pageSizeParam || '10', 10) || 10);
    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: paginated,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      }
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ code: 500, status: 'error', message: 'Gagal memuat daftar role.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await authorizeUserWithPermission('users.manage');
  if (!auth.success) return auth.response;
  const actor = auth.user;

  const parsed = createRoleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || isSuperAdminRole(parsed.data.name)) {
    return NextResponse.json({ code: 400, status: 'error', message: 'Data master role tidak valid.' }, { status: 400 });
  }

  const existing = await prisma.role.findFirst({
    where: { name: { equals: parsed.data.name, mode: 'insensitive' } }
  });
  if (existing) {
    return NextResponse.json({ code: 409, status: 'error', message: 'Nama role sudah terdaftar.' }, { status: 409 });
  }

  try {
    let role;
    try {
      role = await prisma.role.create({
        data: {
          name: parsed.data.name,
          description: parsed.data.description,
          permissions: parsed.data.permissions,
          isActive: true
        }
      });
    } catch (error) {
      if (!isMissingRoleMetadataColumns(error)) throw error;
      const legacyCreated = await prisma.role.create({
        data: {
          name: parsed.data.name,
          permissions: parsed.data.permissions
        },
        select: legacyRoleSelect
      });
      role = addRoleCompatibilityFields(legacyCreated);
    }

    await recordActivity({
      actor,
      action: 'CREATE',
      module: 'RBAC',
      description: `Membuat master role ${role.name}.`,
      entityType: 'Role',
      entityId: role.id,
      metadata: { permissions: parsed.data.permissions },
      request
    });

    return NextResponse.json({ code: 201, status: 'success', data: role }, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ code: 500, status: 'error', message: 'Gagal membuat master role.' }, { status: 500 });
  }
}
