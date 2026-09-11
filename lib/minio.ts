import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const minioEndpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
const minioAccessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const minioSecretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
export const minioBucketName = process.env.MINIO_BUCKET_NAME || 'rio-collection-bucket';
export const minioPublicUrl = process.env.NEXT_PUBLIC_MINIO_PUBLIC_URL || `${minioEndpoint}/${minioBucketName}`;

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

/**
 * Uploads a file buffer to MinIO bucket and returns its public URL.
 */
export async function uploadToMinio(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
  const cleanFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: minioBucketName,
      Key: cleanFileName,
      Body: fileBuffer,
      ContentType: mimeType
    })
  );

  return `${minioPublicUrl}/${cleanFileName}`;
}
