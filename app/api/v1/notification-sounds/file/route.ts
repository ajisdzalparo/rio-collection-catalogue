import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { minioBucketName, s3Client } from '@/lib/minio';

const SOUND_PREFIX = 'notification-sounds/';
const SETTINGS_KEY = `${SOUND_PREFIX}settings.json`;

async function isAuthenticated() {
  const token = (await cookies()).get('auth_token')?.value;
  if (!token) return false;
  try {
    JSON.parse(token);
    return true;
  } catch {
    return false;
  }
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ code: status, status: 'error', message }, { status });
}

export async function GET(request: Request) {
  if (!(await isAuthenticated())) return errorResponse('Sesi admin tidak valid', 401);

  const key = new URL(request.url).searchParams.get('key');
  if (!key || !key.startsWith(SOUND_PREFIX) || key === SETTINGS_KEY || key.includes('..')) {
    return errorResponse('File audio tidak valid', 400);
  }

  try {
    const object = await s3Client.send(
      new GetObjectCommand({ Bucket: minioBucketName, Key: key })
    );
    const body = await object.Body?.transformToByteArray();
    if (!body) return errorResponse('File audio kosong', 404);

    return new Response(Buffer.from(body), {
      status: 200,
      headers: {
        'Content-Type': object.ContentType || 'audio/mpeg',
        'Content-Length': String(body.byteLength),
        'Cache-Control': 'private, max-age=3600',
        'Accept-Ranges': 'bytes'
      }
    });
  } catch (error) {
    console.error('Error streaming notification sound:', error);
    return errorResponse('File audio tidak ditemukan', 404);
  }
}
