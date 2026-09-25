import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/v1/store-banks            → all store bank accounts (CMS)
// GET ?activeOnly=true               → only accounts shown to clients
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const storeBanks = await prisma.storeBank.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    });

    return NextResponse.json({ code: 200, status: 'success', data: storeBanks });
  } catch (error) {
    console.error('Error fetching store banks:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to fetch store bank accounts' },
      { status: 500 }
    );
  }
}

// POST /api/v1/store-banks — add a store bank account
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bankName, accountNumber, accountOwner, isActive, sortOrder } = body;

    if (!bankName?.trim() || !accountNumber?.trim() || !accountOwner?.trim()) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'bankName, accountNumber, accountOwner are required' },
        { status: 400 }
      );
    }

    const trimmedBankName = String(bankName).trim();
    const trimmedAccountNumber = String(accountNumber).trim();

    // Prevent duplicate entries
    const existing = await prisma.storeBank.findFirst({
      where: {
        bankName: { equals: trimmedBankName, mode: 'insensitive' },
        accountNumber: trimmedAccountNumber
      }
    });

    if (existing) {
      return NextResponse.json(
        {
          code: 409,
          status: 'error',
          message: `Nomor rekening ${trimmedAccountNumber} untuk ${trimmedBankName} sudah terdaftar.`
        },
        { status: 409 }
      );
    }

    const storeBank = await prisma.storeBank.create({
      data: {
        bankName: trimmedBankName,
        accountNumber: trimmedAccountNumber,
        accountOwner: String(accountOwner).trim(),
        isActive: isActive !== false,
        sortOrder: Number(sortOrder) || 0
      }
    });

    return NextResponse.json({ code: 201, status: 'success', data: storeBank }, { status: 201 });
  } catch (error) {
    console.error('Error creating store bank:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to create store bank account' },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/store-banks — bulk reorder store banks
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'items array is required' },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      items.map((item: { id: string; sortOrder: number }) =>
        prisma.storeBank.update({
          where: { id: item.id },
          data: { sortOrder: Number(item.sortOrder) || 0 }
        })
      )
    );

    return NextResponse.json({
      code: 200,
      status: 'success',
      message: 'Urutan rekening berhasil diperbarui'
    });
  } catch (error) {
    console.error('Error reordering store banks:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to reorder store bank accounts' },
      { status: 500 }
    );
  }
}
