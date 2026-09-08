import { z } from 'zod';

export const archiveSchema = z.object({
  name: z.string().trim().min(1).max(300),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(10000),
  imageUrl: z.string().min(1).refine((url) => /^https?:\/\//.test(url) || /^data:image\//.test(url) || /^\/(?!\/)/.test(url), 'URL gambar tidak valid'),
  journalId: z.string().min(1).nullable().default(null)
});
