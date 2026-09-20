import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ size: string }> }) {
  try {
    const { size } = await params;
    const body = await request.json();
    const { isActive } = body;

    const updatedSize = await prisma.size.update({
      where: { size },
      data: { isActive }
    });

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: updatedSize
    });
  } catch (error) {
    console.error('Error updating size:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to update size' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  try {
    const { size } = await params;
    const existing = await prisma.size.findUnique({
      where: { size }
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { code: 404, status: 'error', message: 'Size not found or already deleted' },
        { status: 404 }
      );
    }

    await prisma.size.update({
      where: { size },
      data: { deletedAt: new Date() }
    });
    return NextResponse.json({
      code: 200,
      status: 'success',
      message: 'Size deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting size:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to delete size' },
      { status: 500 }
    );
  }
}
