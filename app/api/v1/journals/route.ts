import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { journalSchema } from '@/lib/journal-schema';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    const journals = await prisma.journal.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({
      code: 200,
      status: 'success',
      data: journals
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
    const parsed = journalSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: 'Data jurnal tidak valid', details: parsed.error.flatten() }, { status: 400 });
    const journal = await prisma.journal.create({ data: parsed.data });
    revalidatePath('/journal', 'layout');

    return NextResponse.json({
      code: 201,
      status: 'success',
      data: journal
    });
  } catch (error) {
    console.error('Error creating journal:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to create journal' },
      { status: 500 }
    );
  }
}
