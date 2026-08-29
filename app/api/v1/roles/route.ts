import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({
      code: 200,
      status: 'success',
      data: roles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, permissions } = body;

    const newRole = await prisma.role.create({
      data: {
        name,
        permissions: permissions || {}
      }
    });

    return NextResponse.json({
      code: 201,
      status: 'success',
      data: newRole
    });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to create role' },
      { status: 500 }
    );
  }
}
