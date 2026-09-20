import { z } from 'zod';

export const referralCodeValueSchema = z.string().trim().regex(/^[a-zA-Z0-9]{4,20}$/, 'Kode harus 4–20 huruf atau angka.');
const benefitModeSchema = z.enum(['PERCENTAGE', 'NOMINAL']);

export const partnerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  whatsapp: z.string().trim().max(25).optional(),
  notes: z.string().trim().max(1000).optional()
});

export const createReferralCodeSchema = z.discriminatedUnion('rewardKind', [
  z.object({
    partnerId: z.string().min(1),
    code: referralCodeValueSchema,
    discountMode: benefitModeSchema,
    discountValue: z.number().int().positive(),
    rewardKind: z.literal('CASH'),
    rewardMode: benefitModeSchema,
    rewardValue: z.number().int().positive()
  }),
  z.object({
    partnerId: z.string().min(1),
    code: referralCodeValueSchema,
    discountMode: benefitModeSchema,
    discountValue: z.number().int().positive(),
    rewardKind: z.literal('SHIRT'),
    giftEveryUnits: z.number().int().positive()
  })
]).refine((value) => value.discountMode !== 'PERCENTAGE' || value.discountValue <= 100, {
  message: 'Diskon persentase maksimal 100%.'
}).refine((value) => value.rewardKind !== 'CASH' || value.rewardMode !== 'PERCENTAGE' || value.rewardValue <= 100, {
  message: 'Reward persentase maksimal 100%.'
});
