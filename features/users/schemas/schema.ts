import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  role: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional()
});

export type UserFormValues = z.infer<typeof userSchema>;

export const createUserSchema = userSchema;
export type CreateUserSchema = UserFormValues;

export const updateUserSchema = userSchema.partial();
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
