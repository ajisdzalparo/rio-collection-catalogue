import { NextResponse } from 'next/server';
import { uploadToMinio } from '@/lib/minio';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'No file provided' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const publicUrl = await uploadToMinio(buffer, file.name, file.type || 'image/jpeg');

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: {
        url: publicUrl,
        name: file.name,
        size: file.size
      }
    });
  } catch (error) {
    console.error('Error uploading file to MinIO:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to upload image to MinIO' },
      { status: 500 }
    );
  }
}
