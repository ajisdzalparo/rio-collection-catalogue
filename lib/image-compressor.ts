/**
 * Client-side High Efficiency Image Compressor
 * Resizes excessive dimensions and converts to modern WebP format
 * Drastically reduces payload size (from 5-15MB to ~80-200KB) before upload.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (recommended: 0.82)
  outputFormat?: 'image/webp' | 'image/jpeg';
}

export const DEFAULT_COMPRESSION_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.82,
  outputFormat: 'image/webp'
};

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Compresses an image File using HTML Canvas and modern WebP encoding.
 */
export async function compressImage(
  file: File,
  customOptions?: CompressionOptions
): Promise<File> {
  // If not an image or SVG/GIF, return as is (do not touch animated gifs or svgs)
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  const options = { ...DEFAULT_COMPRESSION_OPTIONS, ...customOptions };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memproses gambar'));
      img.onload = () => {
        let { width, height } = img;

        // Calculate proportional scale if dimensions exceed max bounds
        if (width > options.maxWidth || height > options.maxHeight) {
          const ratio = Math.min(options.maxWidth / width, options.maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // fallback to original if canvas context unavailable
          return;
        }

        // Image smoothing for high-quality downscaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Export to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Only use compressed if it's actually smaller than the original
            if (blob.size >= file.size && file.type === options.outputFormat) {
              resolve(file);
              return;
            }

            const cleanBaseName = file.name.replace(/\.[^/.]+$/, '');
            const ext = options.outputFormat === 'image/webp' ? '.webp' : '.jpg';
            const compressedFile = new File([blob], `${cleanBaseName}${ext}`, {
              type: options.outputFormat,
              lastModified: Date.now()
            });

            resolve(compressedFile);
          },
          options.outputFormat,
          options.quality
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
