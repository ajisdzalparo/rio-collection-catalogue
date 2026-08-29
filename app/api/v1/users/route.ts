import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({
      code: 200,
      status: 'success',
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, role, status } = body;

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role: role || 'Admin',
        status: status || 'active'
      }
    });

    return NextResponse.json({
      code: 201,
      status: 'success',
      data: newUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to create user' },
      { status: 500 }
    );
  }
}
