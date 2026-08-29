import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, isActive } = body;

    const updateData: Partial<{ name: string; description: string; isActive: boolean }> = {};
    if (name !== undefined) updateData.name = name.toUpperCase();
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedTopic = await prisma.topic.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: updatedTopic
    });
  } catch (error) {
    console.error('Error updating topic:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to update topic' },
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
    await prisma.topic.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    return NextResponse.json({
      code: 200,
      status: 'success',
      message: 'Topic deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting topic:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to delete topic' },
      { status: 500 }
    );
  }
}
