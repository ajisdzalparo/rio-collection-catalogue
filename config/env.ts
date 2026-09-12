const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
const backendUrl = process.env.BACKEND_API_URL || '/api';
const minioEndpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
const minioBucketName = process.env.MINIO_BUCKET_NAME || 'rio-collection-bucket';

export const env = {
  apiUrl,
  backendUrl,
  minioEndpoint,
  minioBucketName
};
