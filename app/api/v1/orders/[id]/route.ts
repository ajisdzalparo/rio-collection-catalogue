import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { deductStock, restoreStock } from '@/lib/stock';

const orderStatuses = [
  'PENDING',
  'CONFIRMED',
  'WAITING_PAYMENT',
  'PAID',
  'FULFILLED',
  'REJECTED',
  'CANCELLED',
  'EXPIRED'
] as const;
const adjustmentStatuses = [
  'NONE',
  'CUSTOMER_CONFIRMATION_PENDING',
  'CUSTOMER_CONFIRMED',
  'REFUNDED',
  'REFUND_WAIVED'
] as const;
const updateOrderSchema = z.object({
  status: z.enum(orderStatuses).optional(),
  adminNotes: z.string().max(5000).optional(),
  courierName: z.string().max(120).optional(),
  trackingNumber: z.string().max(120).optional(),
  notes: z.string().max(5000).optional(),
  waFollowedUp: z.boolean().optional(),
  shippingFee: z.number().int().nonnegative().optional(),
  quotedShippingFee: z.number().int().nonnegative().optional(),
  shippingAdjustmentAmount: z.number().int().optional(),
  shippingAdjustmentStatus: z.enum(adjustmentStatuses).optional(),
  shippingAdjustmentNote: z.string().max(5000).optional(),
  shippingAdjustmentWaSent: z.boolean().optional(),
  paymentProofUrl: z.string().url().optional(),
  additionalPaymentProofUrl: z.string().url().optional(),
  refundProofUrl: z.string().url().optional(),
  shippingProofUrl: z.string().url().optional()
});

type UpdateOrderBody = z.infer<typeof updateOrderSchema>;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rawBody: unknown = await request.json().catch(() => ({}));
    const parsed = updateOrderSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Data pembaruan pesanan tidak valid', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const body: UpdateOrderBody = parsed.data;
    const existingOrder = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!existingOrder) {
      return NextResponse.json({ code: 404, status: 'error', message: 'Order tidak ditemukan' }, { status: 404 });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const currentStatus = existingOrder.status;
      const newStatus = body.status;
      if (newStatus && newStatus !== currentStatus) {
        const restoringStatuses = ['CANCELLED', 'REJECTED', 'EXPIRED'];
        const isRestoring = restoringStatuses.includes(newStatus);
        const wasRestored = restoringStatuses.includes(currentStatus);
        if (isRestoring && !wasRestored) await restoreStock(existingOrder.items, tx);
        else if (!isRestoring && wasRestored) await deductStock(existingOrder.items, tx);
      }

      const quotedShippingFee = existingOrder.quotedShippingFee ?? existingOrder.shippingFee ?? 15000;
      const actualShippingFee = body.shippingFee ?? existingOrder.shippingFee ?? quotedShippingFee;
      const shippingAdjustmentAmount = actualShippingFee - quotedShippingFee;
      const adjustmentStatus = shippingAdjustmentAmount === 0
        ? 'NONE'
        : body.shippingAdjustmentStatus ?? 'CUSTOMER_CONFIRMATION_PENDING';
      const previousAppliedSurcharge = existingOrder.shippingAdjustmentStatus === 'CUSTOMER_CONFIRMED'
        ? Math.max(existingOrder.shippingAdjustmentAmount ?? 0, 0)
        : 0;
      const baseCustomerTotal = existingOrder.totalPrice - previousAppliedSurcharge;

      if (shippingAdjustmentAmount > 0 && adjustmentStatus === 'CUSTOMER_CONFIRMED' && !body.additionalPaymentProofUrl && !existingOrder.additionalPaymentProofUrl) {
        throw new Error('Bukti pembayaran kekurangan ongkir wajib diunggah sebelum konfirmasi');
      }
      if (shippingAdjustmentAmount < 0 && adjustmentStatus === 'REFUNDED') {
        if (!body.refundProofUrl && !existingOrder.refundProofUrl) {
          throw new Error('Bukti refund ongkir wajib diunggah sebelum menandai refund selesai');
        }
        const refundNote = body.shippingAdjustmentNote ?? existingOrder.shippingAdjustmentNote;
        if (!refundNote || !refundNote.trim()) {
          throw new Error('Alasan refund wajib diisi sebelum menandai refund selesai');
        }
      }

      const updatedTotalPrice = adjustmentStatus === 'CUSTOMER_CONFIRMED'
        ? baseCustomerTotal + Math.max(shippingAdjustmentAmount, 0)
        : baseCustomerTotal;
      const finalWaFollowedUp = newStatus && newStatus !== currentStatus ? false : body.waFollowedUp;

      return tx.order.update({
        where: { id },
        data: {
          ...(body.status && { status: body.status }),
          ...(body.notes !== undefined && { notes: body.notes }),
          ...(body.adminNotes !== undefined && { adminNotes: body.adminNotes }),
          ...(body.courierName !== undefined && { courierName: body.courierName }),
          ...(body.trackingNumber !== undefined && { trackingNumber: body.trackingNumber }),
          ...(body.quotedShippingFee !== undefined && { quotedShippingFee: body.quotedShippingFee }),
          ...(body.shippingFee !== undefined && { shippingFee: actualShippingFee, shippingAdjustmentAmount, shippingAdjustmentStatus: adjustmentStatus, totalPrice: updatedTotalPrice }),
          ...(body.shippingAdjustmentStatus !== undefined && { shippingAdjustmentStatus: adjustmentStatus }),
          ...(body.shippingAdjustmentNote !== undefined && { shippingAdjustmentNote: body.shippingAdjustmentNote }),
          ...(body.shippingAdjustmentWaSent !== undefined && { shippingAdjustmentWaSent: body.shippingAdjustmentWaSent }),
          ...(body.paymentProofUrl !== undefined && { paymentProofUrl: body.paymentProofUrl }),
          ...(body.additionalPaymentProofUrl !== undefined && { additionalPaymentProofUrl: body.additionalPaymentProofUrl }),
          ...(body.refundProofUrl !== undefined && { refundProofUrl: body.refundProofUrl }),
          ...(body.shippingProofUrl !== undefined && { shippingProofUrl: body.shippingProofUrl }),
          ...(finalWaFollowedUp !== undefined && { waFollowedUp: finalWaFollowedUp })
        },
        include: { items: true }
      });
    });

    return NextResponse.json({ code: 200, status: 'success', data: updatedOrder });
  } catch (error) {
    console.error('Error updating order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update order';
    const isClientError = errorMessage.includes('tidak mencukupi') || errorMessage.includes('tidak ditemukan') || errorMessage.includes('wajib diunggah');
    return NextResponse.json(
      { code: isClientError ? 400 : 500, status: 'error', message: errorMessage },
      { status: isClientError ? 400 : 500 }
    );
  }
}
