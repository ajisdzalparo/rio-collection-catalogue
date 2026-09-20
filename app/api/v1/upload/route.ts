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
    const isReviewMedia = purpose === 'review-media';

    // Authorization checks
    if (!isPaymentProof) {
      if (isReviewMedia) {
        // Customer or Admin can upload review media
        const { getCustomerFromRequest } = await import('@/lib/customer-auth');
        const customer = await getCustomerFromRequest(request);
        const cookieStore = await cookies();
        const adminToken = cookieStore.get('auth_token')?.value;
        const authHeader = request.headers.get('authorization');

        if (!customer && !adminToken && !authHeader) {
          return NextResponse.json(
            { code: 401, status: 'error', message: 'Anda harus masuk akun untuk mengunggah foto/video ulasan.' },
            { status: 401 }
          );
        }
      } else {
        // Admin only for other media purposes
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
    }

    // Validation for file formats and size limits
    if (isReviewMedia) {
      const isVideo = ['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type);
      const isPhoto = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);

      if (!isPhoto && !isVideo) {
        return NextResponse.json(
          { code: 400, status: 'error', message: 'Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau MP4/WEBM/MOV.' },
          { status: 400 }
        );
      }

      const maxBytes = isVideo ? 10 * 1024 * 1024 : 3 * 1024 * 1024; // 10MB video, 3MB photo
      if (file.size > maxBytes) {
        return NextResponse.json(
          {
            code: 400,
            status: 'error',
            message: isVideo
              ? 'Ukuran video ulasan maksimal 10 MB.'
              : 'Ukuran foto ulasan maksimal 3 MB.'
          },
          { status: 400 }
        );
      }
    } else {
      const allowedTypes = isPaymentProof
        ? ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
        : ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      const maxBytes = isPaymentProof ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
      if (!allowedTypes.includes(file.type) || file.size > maxBytes) {
        return NextResponse.json(
          { code: 400, status: 'error', message: 'Format atau ukuran file tidak valid.' },
          { status: 400 }
        );
      }
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
