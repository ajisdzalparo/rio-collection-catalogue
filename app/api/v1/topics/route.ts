import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const topics = await prisma.topic.findMany({
      where: { deletedAt: null }
    });
    return NextResponse.json({
      code: 200,
      status: 'success',
      data: topics
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    const newTopic = await prisma.topic.create({
      data: {
        name: (name || '').toUpperCase(),
        description: description || ''
      }
    });

    return NextResponse.json({
      code: 201,
      status: 'success',
      data: newTopic
    });
  } catch (error) {
    console.error('Error creating topic:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to create topic' },
      { status: 500 }
    );
  }
}
