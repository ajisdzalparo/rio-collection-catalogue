import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getActivityLogViewer } from '@/lib/auth/authorization';
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
        : undefined,
    isSystemRole: isSuperAdminRole(role.name),
    isActive: true
  };
}

const createRoleSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).optional(),
  permissions: z.record(z.string(), z.boolean()).default({})
});

export async function GET() {
  const viewer = await getActivityLogViewer();
  if (!viewer) return NextResponse.json({ code: 403, status: 'error', message: 'Akses master role ditolak.' }, { status: 403 });
  try {
    let roles;
    try {
      roles = await prisma.role.findMany({ orderBy: { createdAt: 'asc' } });
    } catch (error) {
      if (!isMissingRoleMetadataColumns(error)) throw error;
      const legacyRoles = await prisma.role.findMany({ select: legacyRoleSelect, orderBy: { createdAt: 'asc' } });
      roles = legacyRoles.map(addRoleCompatibilityFields);
    }
    return NextResponse.json({ code: 200, status: 'success', data: roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ code: 500, status: 'error', message: 'Gagal memuat master role.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const actor = await getActivityLogViewer();
  if (!actor) return NextResponse.json({ code: 403, status: 'error', message: 'Hanya Owner dan Super Admin yang dapat menambah role.' }, { status: 403 });

  const parsed = createRoleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ code: 400, status: 'error', message: 'Data master role tidak valid.' }, { status: 400 });
  if (isSuperAdminRole(parsed.data.name)) return NextResponse.json({ code: 403, status: 'error', message: 'Role Super Admin tidak dapat dibuat ulang.' }, { status: 403 });

  try {
    let existing;
    try {
      existing = await prisma.role.findFirst({ where: { name: { equals: parsed.data.name, mode: 'insensitive' } } });
    } catch (error) {
      if (!isMissingRoleMetadataColumns(error)) throw error;
      existing = await prisma.role.findFirst({
        where: { name: { equals: parsed.data.name, mode: 'insensitive' } },
        select: legacyRoleSelect
      });
    }
    if (existing) return NextResponse.json({ code: 409, status: 'error', message: 'Nama role sudah digunakan.' }, { status: 409 });

    let role;
    try {
      role = await prisma.role.create({ data: { ...parsed.data, isActive: true, isSystemRole: false } });
    } catch (error) {
      if (!isMissingRoleMetadataColumns(error)) throw error;
      const legacyRole = await prisma.role.create({
        data: { name: parsed.data.name, permissions: parsed.data.permissions },
        select: legacyRoleSelect
      });
      role = addRoleCompatibilityFields(legacyRole);
    }
    await recordActivity({
      actor,
      action: 'CREATE',
      module: 'RBAC',
      description: `Menambahkan master role ${role.name}.`,
      entityType: 'Role',
      entityId: role.id,
      metadata: { permissionCount: Object.values(parsed.data.permissions).filter(Boolean).length },
      request
    });
    return NextResponse.json({ code: 201, status: 'success', data: role }, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ code: 500, status: 'error', message: 'Gagal menambahkan master role.' }, { status: 500 });
  }
}
