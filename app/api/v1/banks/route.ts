import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/v1/banks            → all master banks (CMS)
// GET ?activeOnly=true         → only active banks
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const banks = await prisma.bank.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ code: 200, status: 'success', data: banks });
  } catch (error) {
    console.error('Error fetching banks:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to fetch banks' },
      { status: 500 }
    );
  }
}

// POST /api/v1/banks — create master bank
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, logoUrl, isActive } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Bank name is required' },
        { status: 400 }
      );
    }

    const bank = await prisma.bank.create({
      data: {
        name: name.trim(),
        code: code?.trim() || name.trim().toUpperCase(),
        logoUrl: logoUrl || null,
        isActive: isActive !== false
      }
    });

    return NextResponse.json({ code: 201, status: 'success', data: bank }, { status: 201 });
  } catch (error) {
    console.error('Error creating bank:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to create bank' },
      { status: 500 }
    );
  }
}
