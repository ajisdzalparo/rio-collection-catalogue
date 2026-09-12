import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().email('Alamat email tidak valid.');
const passwordSchema = z
  .string()
  .min(8, 'Kata sandi baru minimal 8 karakter.')
  .max(128, 'Kata sandi baru maksimal 128 karakter.');

export const passwordResetRequestSchema = z
  .object({ email: emailSchema })
  .strict();

export const passwordResetConfirmSchema = z
  .object({
    email: emailSchema,
    otpCode: z.string().regex(/^\d{6}$/, 'Kode OTP harus terdiri dari 6 digit.'),
    newPassword: passwordSchema
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, 'Kata sandi wajib diisi.').max(128)
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Kata sandi saat ini wajib diisi.').max(128),
    newPassword: passwordSchema
  })
  .strict();
