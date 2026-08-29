import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, slug, author, category, imageUrl, excerpt, content, pullQuote, relatedProductSlug } = body;

    const updatedJournal = await prisma.journal.update({
      where: { id },
      data: {
        title,
        slug,
        author,
        category,
        imageUrl,
        excerpt,
        content: Array.isArray(content) ? content : [content],
        pullQuote,
        relatedProductSlug
      }
    });

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
