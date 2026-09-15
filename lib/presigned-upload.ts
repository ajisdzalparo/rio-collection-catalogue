import axios from 'axios';

export interface PresignUploadOptions {
  purpose?: string;
  onProgress?: (percent: number) => void;
}

/**
 * Uploads a file directly to S3/MinIO via a presigned PUT URL.
 * Falls back to legacy /api/v1/upload if presigned fails.
 */
export async function uploadFileWithPresign(
  file: File,
  options: PresignUploadOptions = {}
): Promise<string> {
  const { purpose = 'journal-image', onProgress } = options;

  try {
    // 1. Request Presigned URL from Next.js server
    const { data: res } = await axios.post('/api/v1/upload/presign', {
      fileName: file.name,
      fileType: file.type || 'image/jpeg',
      purpose
    });

    if (res?.data?.uploadUrl && res?.data?.publicUrl) {
      const { uploadUrl, publicUrl } = res.data;

      // 2. Direct PUT to S3 / MinIO storage
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type || 'image/jpeg'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        }
      });

      return publicUrl;
    }
  } catch (presignErr) {
    console.warn('Presigned upload failed, falling back to server buffer upload:', presignErr);
  }

  // Fallback to server buffer upload route
  const formData = new FormData();
  formData.append('file', file);
  formData.append('purpose', purpose);

  const { data: serverRes } = await axios.post('/api/v1/upload', formData);
  if (serverRes?.data?.url) {
    return serverRes.data.url;
  }

  throw new Error('Gagal mengunggah gambar');
}
