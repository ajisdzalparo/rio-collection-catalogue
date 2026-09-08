import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { archiveSchema } from '@/lib/archive-schema';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    const archives = await prisma.archive.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({
      code: 200,
      status: 'success',
      data: archives
    });
  } catch (error) {
    console.error('Error fetching archives:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to fetch archives' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const parsed = archiveSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ message: 'Data arsip tidak valid', details: parsed.error.flatten() }, { status: 400 });
    if (parsed.data.journalId && !await prisma.journal.findUnique({ where: { id: parsed.data.journalId } })) {
      return NextResponse.json({ message: 'Artikel jurnal tidak ditemukan' }, { status: 400 });
    }
    const archive = await prisma.archive.create({ data: parsed.data });
    revalidatePath('/archive');
    revalidatePath('/catalogue');
    return NextResponse.json({ code: 201, status: 'success', data: archive }, { status: 201 });
  } catch (error) {
    const duplicate = error && typeof error === 'object' && 'code' in error && error.code === 'P2002';
    return NextResponse.json({ message: duplicate ? 'Slug arsip sudah digunakan' : 'Gagal menyimpan arsip' }, { status: duplicate ? 409 : 500 });
  }
}
