import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const materialTypes = ['FABRIC', 'TREATMENT', 'ORIGIN', 'CARE'] as const;

const createMaterialSchema = z.object({
  type: z.enum(materialTypes),
  name: z.string().min(1, 'Nama material wajib diisi').max(200),
  description: z.string().max(1000).optional()
});

const updateMaterialSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional()
});

export async function GET() {
  try {
    const items = await prisma.materialMaster.findMany({
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ code: 200, status: 'success', data: items });
  } catch (error) {
    console.error('Failed to fetch materials:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal mengambil data master material' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const rawBody: unknown = await request.json().catch(() => ({}));
    const parsed = createMaterialSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          code: 400,
          status: 'error',
          message: 'Data material tidak valid',
          details: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const created = await prisma.materialMaster.create({
      data: parsed.data
    });

    return NextResponse.json({ code: 201, status: 'success', data: created }, { status: 201 });
  } catch (error) {
    console.error('Failed to create material:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal menambahkan data master material' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const rawBody: unknown = await request.json().catch(() => ({}));
    const parsed = updateMaterialSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          code: 400,
          status: 'error',
          message: 'Data update tidak valid',
          details: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;
    const updated = await prisma.materialMaster.update({
      where: { id },
      data
    });

    return NextResponse.json({ code: 200, status: 'success', data: updated });
  } catch (error) {
    console.error('Failed to update material:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal memperbarui data master material' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'ID material wajib disertakan' },
        { status: 400 }
      );
    }

    await prisma.materialMaster.delete({ where: { id } });
    return NextResponse.json({
      code: 200,
      status: 'success',
      message: 'Material berhasil dihapus'
    });
  } catch (error) {
    console.error('Failed to delete material:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal menghapus data master material' },
      { status: 500 }
    );
  }
}
