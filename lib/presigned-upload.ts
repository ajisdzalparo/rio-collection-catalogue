import axios from 'axios';

export interface PresignUploadOptions {
  purpose?: string;
  onProgress?: (percent: number) => void;
}

/**
 * Uploads a file via /api/v1/upload to MinIO/S3.
 */
export async function uploadFileWithPresign(
  file: File,
  options: PresignUploadOptions = {}
): Promise<string> {
  const { purpose = 'product-image', onProgress } = options;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('purpose', purpose);

  const { data: serverRes } = await axios.post('/api/v1/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 30000,
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    }
  });

  if (serverRes?.data?.url) {
    return serverRes.data.url;
  }

  throw new Error(serverRes?.message || 'Gagal mengunggah gambar');
}
