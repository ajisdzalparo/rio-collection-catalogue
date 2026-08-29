import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { alt, imageUrl } = body;

    const updatedTestimony = await prisma.testimony.update({
      where: { id },
      data: {
        ...(alt !== undefined && { alt }),
        ...(imageUrl !== undefined && { imageUrl })
      }
    });

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: updatedTestimony
    });
  } catch (error) {
    console.error('Error updating testimony:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to update testimony' },
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
    await prisma.testimony.delete({
      where: { id }
    });
    return NextResponse.json({
      code: 200,
      status: 'success',
      message: 'Testimony deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting testimony:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to delete testimony' },
      { status: 500 }
    );
  }
}
