import { z } from 'zod';

export const orderSchema = z.object({
  fullName: z.string().trim().min(1).max(160),
  whatsapp: z.string().trim().min(9).max(25),
  address: z.string().trim().min(1).max(2000),
  notes: z.string().max(5000).optional(),
  captchaToken: z.string().min(1).max(10000),
  shippingFee: z.number().int().nonnegative(),
  shipping: z.object({
    destination: z.string().min(1).max(100),
    courier: z.string().min(1).max(40),
    service: z.string().min(1).max(100)
  }),
  items: z.array(z.object({
    productId: z.string().min(1),
    size: z.string().min(1).max(30),
    color: z.string().max(100).optional(),
    quantity: z.number().int().min(1).max(99)
  })).min(1).max(30)
});
