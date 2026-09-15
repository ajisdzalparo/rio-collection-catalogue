import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPresignedUploadUrl } from '@/lib/minio';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { fileName, fileType, purpose } = body as {
      fileName?: string;
      fileType?: string;
      purpose?: string;
    };

    if (!fileName || !fileType) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'fileName dan fileType wajib diisi' },
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
          { code: 401, status: 'error', message: 'Autentikasi admin diperlukan untuk meminta presigned URL.' },
          { status: 401 }
        );
      }
    }

    const allowedTypes = isPaymentProof
      ? ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      : ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Tipe file tidak didukung' },
        { status: 400 }
      );
    }

    const { uploadUrl, publicUrl, key } = await getPresignedUploadUrl(fileName, fileType, 600);

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: {
        uploadUrl,
        publicUrl,
        key
      }
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal membuat presigned upload URL' },
      { status: 500 }
    );
  }
}
