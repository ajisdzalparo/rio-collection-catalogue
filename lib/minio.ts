import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const minioEndpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
const minioAccessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const minioSecretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
export const minioBucketName = process.env.MINIO_BUCKET_NAME || 'rio-collection-bucket';
export const minioPublicUrl = process.env.NEXT_PUBLIC_MINIO_PUBLIC_URL || `${minioEndpoint}/${minioBucketName}`;
const IMAGE_PREFIX = 'images/';

const minioRegion = process.env.MINIO_REGION || 'us-east-1';

export const s3Client = new S3Client({
  endpoint: minioEndpoint,
  region: minioRegion,
  credentials: {
    accessKeyId: minioAccessKey,
    secretAccessKey: minioSecretKey
  },
  forcePathStyle: process.env.MINIO_FORCE_PATH_STYLE !== 'false'
});

export interface PresignedUploadResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

/**
 * Generates a presigned PUT URL for direct browser-to-S3/MinIO uploads.
 */
export async function getPresignedUploadUrl(
  fileName: string,
  mimeType: string,
  expiresInSeconds: number = 600
): Promise<PresignedUploadResult> {
  const cleanFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const objectKey = `${IMAGE_PREFIX}${cleanFileName}`;

  const command = new PutObjectCommand({
    Bucket: minioBucketName,
    Key: objectKey,
    ContentType: mimeType
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  const publicUrl = `${minioPublicUrl}/${objectKey}`;

  return {
    uploadUrl,
    publicUrl,
    key: objectKey
  };
}

/**
 * Uploads a file buffer directly to MinIO bucket and returns its public URL.
 */
export async function uploadToMinio(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
  const cleanFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const objectKey = `${IMAGE_PREFIX}${cleanFileName}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: minioBucketName,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: mimeType
    })
  );

  return `${minioPublicUrl}/${objectKey}`;
}
