import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { minioBucketName, s3Client } from '@/lib/minio';

const SOUND_PREFIX = 'notification-sounds/';
const SETTINGS_KEY = `${SOUND_PREFIX}settings.json`;

import { parseAuthCookieUser } from '@/lib/auth/roles';

async function isAuthenticated(request?: Request) {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get('auth_token')?.value;
  const authHeader = request?.headers.get('authorization')?.replace('Bearer ', '');
  const token = rawCookie || authHeader;
  return Boolean(parseAuthCookieUser(token));
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ code: status, status: 'error', message }, { status });
}

export async function GET(request: Request) {
  if (!(await isAuthenticated(request))) return errorResponse('Sesi admin tidak valid', 401);

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

    const rangeHeader = request.headers.get('range');
    const totalLength = body.byteLength;

    if (rangeHeader && rangeHeader.startsWith('bytes=')) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10) || 0;
      const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;

      if (start >= totalLength || end >= totalLength) {
        return new Response(null, {
          status: 416,
          headers: { 'Content-Range': `bytes */${totalLength}` }
        });
      }

      const chunk = body.subarray(start, end + 1);
      return new Response(Buffer.from(chunk), {
        status: 206,
        headers: {
          'Content-Type': object.ContentType || 'audio/mpeg',
          'Content-Range': `bytes ${start}-${end}/${totalLength}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunk.byteLength),
          'Cache-Control': 'private, max-age=86400'
        }
      });
    }

    return new Response(Buffer.from(body), {
      status: 200,
      headers: {
        'Content-Type': object.ContentType || 'audio/mpeg',
        'Content-Length': String(totalLength),
        'Cache-Control': 'private, max-age=86400',
        'Accept-Ranges': 'bytes'
      }
    });
  } catch (error) {
    console.error('Error streaming notification sound:', error);
    return errorResponse('File audio tidak ditemukan', 404);
  }
}
