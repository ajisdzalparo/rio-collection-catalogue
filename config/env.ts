const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
const backendUrl = process.env.BACKEND_API_URL || '/api';
const minioEndpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
const minioBucketName = process.env.MINIO_BUCKET_NAME || 'rio-collection-bucket';
const recaptchaSiteKey =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

export const env = {
  apiUrl,
  backendUrl,
  minioEndpoint,
  minioBucketName,
  recaptchaSiteKey
};
