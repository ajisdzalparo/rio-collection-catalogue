import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, hex, isActive } = body;

    const updateData: Partial<{ name: string; hex: string; isActive: boolean }> = {};
    if (name !== undefined) updateData.name = name;
    if (hex !== undefined) updateData.hex = hex;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedColor = await prisma.color.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: updatedColor
    });
  } catch (error) {
    console.error('Error updating color:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to update color' },
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
    const existing = await prisma.color.findUnique({
      where: { id }
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { code: 404, status: 'error', message: 'Color not found or already deleted' },
        { status: 404 }
      );
    }

    await prisma.color.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    return NextResponse.json({
      code: 200,
      status: 'success',
      message: 'Color deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting color:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to delete color' },
      { status: 500 }
    );
  }
}
