import { z } from 'zod';

const optionalProfileText = (max: number) => z.string().trim().max(max).optional();

export const customerProfileSchema = z
  .object({
    fullName: optionalProfileText(160),
    address: optionalProfileText(2000),
    cityId: optionalProfileText(100),
    cityName: optionalProfileText(160),
    provinceName: optionalProfileText(160),
    district: optionalProfileText(160),
    postalCode: optionalProfileText(20)
  })
  .strict();

export const whatsappChangeRequestSchema = z
  .object({
    whatsapp: z.string().trim().min(9).max(25)
  })
  .strict();

export const whatsappChangeConfirmSchema = whatsappChangeRequestSchema
  .extend({
    otpCode: z.string().trim().regex(/^\d{6}$/, 'Kode OTP harus terdiri dari 6 digit.')
  })
  .strict();
