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

export async function GET() {
  try {
    const journals = await prisma.journal.findMany({
      include: {
        productLinks: {
          where: { product: { deletedAt: null } },
          include: { product: { select: productSummarySelect } },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({
      code: 200,
      status: 'success',
      data: journals.map((journal) =>
        mapJournalRelations(journal as unknown as Parameters<typeof mapJournalRelations>[0])
      )
    });
  } catch (error) {
    console.error('Error fetching journals:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to fetch journals' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { code: 401, status: 'error', message: 'Anda harus login untuk menulis artikel blog.' },
        { status: 401 }
      );
    }

    const parsed = journalSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: 'Data artikel blog tidak valid', details: parsed.error.flatten() }, { status: 400 });
    const journal = await prisma.journal.create({
      data: {
        ...parsed.data,
        author: user.name.trim()
      },
      include: { productLinks: { include: { product: { select: productSummarySelect } } } }
    });
    revalidatePath('/journal', 'layout');

    await recordActivity({
      actor: user,
      action: 'CREATE',
      module: 'JOURNALS',
      description: `Menerbitkan artikel blog ${journal.title}.`,
      entityType: 'Journal',
      entityId: journal.id,
      metadata: { slug: journal.slug, category: journal.category },
      request
    });

    return NextResponse.json({
      code: 201,
      status: 'success',
      data: mapJournalRelations(journal as unknown as Parameters<typeof mapJournalRelations>[0])
    });
  } catch (error) {
    console.error('Error creating journal:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to create journal' },
      { status: 500 }
    );
  }
}
