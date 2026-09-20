import { z } from 'zod';
import { sanitizeArticleHtml } from '@/lib/sanitize-html';

export const journalSchema = z.object({
  title: z.string().trim().min(1, 'Judul artikel wajib diisi').max(300),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Format slug tidak valid'),
  author: z.string().trim().min(1, 'Penulis wajib diisi').max(160),
  date: z.string().min(1, 'Tanggal rilis wajib diisi').max(80),
  category: z.string().min(1, 'Kategori artikel wajib dipilih').max(100),
  imageUrl: z.string().trim().min(1, 'Cover foto artikel wajib diunggah'),
  excerpt: z.string().max(10000),
  content: z.array(z.string()),
  contentHtml: z.string().max(20000000).optional().transform((html) => html ? sanitizeArticleHtml(html) : null),
  pullQuote: z.string().max(10000).nullish().transform((value) => value || null),
  relatedProductSlug: z.string().max(300).nullish().transform((value) => value || null),
  seoTitle: z.string().trim().max(70).nullish().transform((value) => value || null),
  seoDescription: z.string().trim().max(160).nullish().transform((value) => value || null),
  ogImageUrl: z.string().trim().max(2000000).nullish().transform((value) => value || null)
});
