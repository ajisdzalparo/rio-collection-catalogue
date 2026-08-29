import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/v1/store-banks/[id] — update store bank account
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { bankName, accountNumber, accountOwner, isActive, sortOrder } = body;

    const storeBank = await prisma.storeBank.update({
      where: { id },
      data: {
        ...(bankName !== undefined && { bankName: String(bankName).trim() }),
        ...(accountNumber !== undefined && { accountNumber: String(accountNumber).trim() }),
        ...(accountOwner !== undefined && { accountOwner: String(accountOwner).trim() }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) })
      }
    });

    return NextResponse.json({ code: 200, status: 'success', data: storeBank });
  } catch (error) {
    console.error('Error updating store bank:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to update store bank account' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/store-banks/[id]
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.storeBank.delete({ where: { id } });
    return NextResponse.json({ code: 200, status: 'success', message: 'Store bank deleted' });
  } catch (error) {
    console.error('Error deleting store bank:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to delete store bank account' },
      { status: 500 }
    );
  }
}
