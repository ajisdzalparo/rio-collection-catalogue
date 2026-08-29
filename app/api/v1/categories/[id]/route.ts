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

    const updateData: Partial<{ name: string; slug: string; description: string | null; isActive: boolean }> = {};
    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to update category' },
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
    await prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    return NextResponse.json({
      code: 200,
      status: 'success',
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
