import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { journalSchema } from '@/lib/journal-schema';
import { revalidatePath } from 'next/cache';
import { mapJournalRelations } from '@/lib/catalogue-relations';
import { getAuthenticatedUser } from '@/lib/auth/authorization';
import { recordActivity } from '@/lib/activity-log';

const productSummarySelect = {
  id: true, slug: true, name: true, imageUrl: true, price: true, status: true, category: true, color: true
} as const;

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actor = await getAuthenticatedUser();
    const parsed = journalSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: 'Data jurnal tidak valid', details: parsed.error.flatten() }, { status: 400 });
    const updatedJournal = await prisma.journal.update({
      where: { id },
      data: parsed.data,
      include: {
        productLinks: {
          where: { product: { deletedAt: null } },
          include: { product: { select: productSummarySelect } }
        }
      }
    });
    revalidatePath('/journal', 'layout');

    await recordActivity({
      actor,
      action: 'UPDATE',
      module: 'JOURNALS',
      description: `Memperbarui jurnal ${updatedJournal.title}.`,
      entityType: 'Journal',
      entityId: updatedJournal.id,
      metadata: { slug: updatedJournal.slug, category: updatedJournal.category },
      request
    });

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: mapJournalRelations(
        updatedJournal as unknown as Parameters<typeof mapJournalRelations>[0]
      )
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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actor = await getAuthenticatedUser();
    const journal = await prisma.journal.delete({
      where: { id }
    });
    revalidatePath('/journal', 'layout');
    await recordActivity({
      actor,
      action: 'DELETE',
      module: 'JOURNALS',
      description: `Menghapus jurnal ${journal.title}.`,
      entityType: 'Journal',
      entityId: journal.id,
      metadata: { slug: journal.slug },
      request
    });
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
