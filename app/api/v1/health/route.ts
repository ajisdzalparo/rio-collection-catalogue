import { NextResponse } from 'next/server';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { s3Client, minioBucketName } from '@/lib/minio';

export async function GET() {
  let minioStatus: { ok: boolean; error?: string; endpoint?: string; bucket?: string } = { ok: false };
  try {
    await s3Client.send(
      new ListObjectsV2Command({ Bucket: minioBucketName, Prefix: 'notification-sounds/', MaxKeys: 1 })
    );
    minioStatus = { ok: true, bucket: minioBucketName };
  } catch (err: unknown) {
    const e = err as Error & { code?: string; $metadata?: { httpStatusCode?: number } };
    minioStatus = {
      ok: false,
      error: `${e.name}: ${e.message}`,
      endpoint: process.env.MINIO_ENDPOINT || '(default: http://localhost:9000)',
      bucket: minioBucketName
    };
  }

  return NextResponse.json(
    {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      minio: minioStatus
    },
    { status: 200 }
  );
}
