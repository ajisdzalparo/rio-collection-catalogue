import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { uploadToMinio } from '@/lib/minio';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const purpose = formData.get('purpose');

    if (!file) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'No file provided' },
        { status: 400 }
      );
    }

    const isPaymentProof = purpose === 'payment-proof';

    // If not payment-proof, require authenticated admin session
    if (!isPaymentProof) {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth_token')?.value;
      const authHeader = request.headers.get('authorization');
      if (!token && !authHeader) {
        return NextResponse.json(
          { code: 401, status: 'error', message: 'Autentikasi admin diperlukan untuk mengunggah file media.' },
          { status: 401 }
        );
      }
    }
    const allowedTypes = isPaymentProof
      ? ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      : ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    const maxBytes = isPaymentProof ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (!allowedTypes.includes(file.type) || file.size > maxBytes) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Format atau ukuran file tidak valid' },
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
