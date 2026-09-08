import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { journalSchema } from '@/lib/journal-schema';
import { revalidatePath } from 'next/cache';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsed = journalSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: 'Data jurnal tidak valid', details: parsed.error.flatten() }, { status: 400 });
    const updatedJournal = await prisma.journal.update({
      where: { id },
      data: parsed.data
    });
    revalidatePath('/journal', 'layout');

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: updatedJournal
    });
  } catch (error) {
    console.error('Error updating journal:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to update journal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.journal.delete({
      where: { id }
    });
    revalidatePath('/journal', 'layout');
    revalidatePath('/archive');
    return NextResponse.json({
      code: 200,
      status: 'success',
      message: 'Journal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting journal:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to delete journal' },
      { status: 500 }
    );
  }
}
