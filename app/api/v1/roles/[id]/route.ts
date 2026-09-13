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

const updateRoleSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(300).nullable().optional(),
  permissions: z.record(z.string(), z.boolean()).optional(),
  isActive: z.boolean().optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getActivityLogViewer();
  if (!actor) return NextResponse.json({ code: 403, status: 'error', message: 'Akses perubahan role ditolak.' }, { status: 403 });

  const { id } = await params;
  let existing;
  try {
    existing = await prisma.role.findUnique({ where: { id } });
  } catch (error) {
    if (!isMissingRoleMetadataColumns(error)) throw error;
    existing = await prisma.role.findUnique({ where: { id }, select: legacyRoleSelect });
  }
  if (!existing) return NextResponse.json({ code: 404, status: 'error', message: 'Master role tidak ditemukan.' }, { status: 404 });
  if (isSuperAdminRole(existing.name)) return NextResponse.json({ code: 403, status: 'error', message: 'Role Super Admin dilindungi dan tidak dapat diubah.' }, { status: 403 });

  const parsed = updateRoleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (parsed.data.name && isSuperAdminRole(parsed.data.name))) {
    return NextResponse.json({ code: 400, status: 'error', message: 'Perubahan master role tidak valid.' }, { status: 400 });
  }

  try {
    let role;
    try {
      role = await prisma.role.update({ where: { id }, data: parsed.data });
    } catch (error) {
      if (!isMissingRoleMetadataColumns(error)) throw error;
      role = await prisma.role.update({
        where: { id },
        data: {
          ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
          ...(parsed.data.permissions !== undefined ? { permissions: parsed.data.permissions } : {})
        },
        select: legacyRoleSelect
      });
    }
    await recordActivity({
      actor,
      action: 'UPDATE',
      module: 'RBAC',
      description: `Memperbarui master role ${role.name}.`,
      entityType: 'Role',
      entityId: role.id,
      metadata: { changedFields: Object.keys(parsed.data) },
      request
    });
    return NextResponse.json({ code: 200, status: 'success', data: role });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ code: 500, status: 'error', message: 'Gagal memperbarui master role.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getActivityLogViewer();
  if (!actor) return NextResponse.json({ code: 403, status: 'error', message: 'Akses penghapusan role ditolak.' }, { status: 403 });

  const { id } = await params;
  let role;
  try {
    role = await prisma.role.findUnique({ where: { id } });
  } catch (error) {
    if (!isMissingRoleMetadataColumns(error)) throw error;
    role = await prisma.role.findUnique({ where: { id }, select: legacyRoleSelect });
  }
  if (!role) return NextResponse.json({ code: 404, status: 'error', message: 'Master role tidak ditemukan.' }, { status: 404 });
  if (isSuperAdminRole(role.name)) return NextResponse.json({ code: 403, status: 'error', message: 'Role Super Admin tidak dapat dihapus.' }, { status: 403 });

  const assignedUsers = await prisma.user.count({ where: { role: role.name } });
  if (assignedUsers > 0) return NextResponse.json({ code: 409, status: 'error', message: `Role masih digunakan oleh ${assignedUsers} pengguna.` }, { status: 409 });

  try {
    await prisma.role.delete({ where: { id } });
    await recordActivity({ actor, action: 'DELETE', module: 'RBAC', description: `Menghapus master role ${role.name}.`, entityType: 'Role', entityId: role.id, request });
    return NextResponse.json({ code: 200, status: 'success', message: 'Master role berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({ code: 500, status: 'error', message: 'Gagal menghapus master role.' }, { status: 500 });
  }
}
