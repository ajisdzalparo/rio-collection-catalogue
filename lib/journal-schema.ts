import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

export const journalSchema = z.object({
  title: z.string().trim().min(1).max(300),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  author: z.string().trim().min(1).max(160),
  date: z.string().min(1).max(80),
  category: z.string().min(1).max(100),
  imageUrl: z.string().min(1),
  excerpt: z.string().max(10000),
  content: z.array(z.string()),
  contentHtml: z.string().max(2000000).optional().transform((html) => html ? DOMPurify.sanitize(html) : null),
  pullQuote: z.string().max(10000).nullish().transform((value) => value || null)
});
