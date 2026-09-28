import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(1, 'Nama lengkap wajib diisi'),
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  role: z.string().min(1, 'Role wajib dipilih'),
  password: z
    .string()
    .min(8, 'Kata sandi minimal 8 karakter')
    .optional()
    .or(z.literal('')),
  status: z.enum(['active', 'inactive']).optional()
});

export type UserFormValues = z.infer<typeof userSchema>;

export const createUserSchema = userSchema.extend({
  password: z.string().min(8, 'Kata sandi wajib diisi minimal 8 karakter')
});
export type CreateUserSchema = z.infer<typeof createUserSchema>;

export const updateUserSchema = userSchema.partial();
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;

