import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/v1/banks/[id] — update master bank
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, code, logoUrl, isActive } = body;

    const bank = await prisma.bank.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(code !== undefined && { code: String(code).trim() }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) })
      }
    });

    return NextResponse.json({ code: 200, status: 'success', data: bank });
  } catch (error) {
    console.error('Error updating bank:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to update bank' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/banks/[id] — delete master bank
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.bank.delete({ where: { id } });
    return NextResponse.json({ code: 200, status: 'success', message: 'Bank deleted' });
  } catch (error) {
    console.error('Error deleting bank:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to delete bank' },
      { status: 500 }
    );
  }
}
