import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { archiveSchema } from '@/lib/archive-schema';

interface ArchiveContext { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: ArchiveContext) {
  try {
    const { id } = await params;
    const parsed = archiveSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ message: 'Data arsip tidak valid', details: parsed.error.flatten() }, { status: 400 });
    if (parsed.data.journalId && !await prisma.journal.findUnique({ where: { id: parsed.data.journalId } })) {
      return NextResponse.json({ message: 'Artikel jurnal tidak ditemukan' }, { status: 400 });
    }
    const archive = await prisma.archive.update({ where: { id }, data: parsed.data });
    revalidatePath('/archive');
    revalidatePath('/catalogue');
    return NextResponse.json({ code: 200, status: 'success', data: archive });
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : '';
    return NextResponse.json({ message: code === 'P2002' ? 'Slug arsip sudah digunakan' : 'Gagal memperbarui arsip' }, { status: code === 'P2002' ? 409 : code === 'P2025' ? 404 : 500 });
  }
}

export async function DELETE(_request: Request, { params }: ArchiveContext) {
  try {
    const { id } = await params;
    await prisma.archive.delete({ where: { id } });
    revalidatePath('/archive');
    revalidatePath('/catalogue');
    return NextResponse.json({ code: 200, status: 'success' });
  } catch {
    return NextResponse.json({ message: 'Gagal menghapus arsip' }, { status: 500 });
  }
}
