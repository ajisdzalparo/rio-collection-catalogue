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

class OrderWorkflowError extends Error {
  constructor(message: string, readonly statusCode: 400 | 409 = 400) {
    super(message);
    this.name = 'OrderWorkflowError';
  }
}

const allowedStatusTransitions: Record<string, readonly string[]> = {
  PENDING: ['WAITING_PAYMENT', 'CANCELLED', 'REJECTED'],
  CONFIRMED: ['WAITING_PAYMENT', 'CANCELLED'],
  WAITING_PAYMENT: ['PAID', 'CANCELLED'],
  PAID: ['FULFILLED', 'CANCELLED'],
  FULFILLED: [],
  CANCELLED: [],
  REJECTED: [],
  EXPIRED: []
};

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
      const quotedShippingFee = existingOrder.quotedShippingFee ?? existingOrder.shippingFee ?? 15000;
      const actualShippingFee = body.shippingFee ?? existingOrder.shippingFee ?? quotedShippingFee;
      const shippingAdjustmentAmount = actualShippingFee - quotedShippingFee;
      const adjustmentStatus = shippingAdjustmentAmount === 0
        ? 'NONE'
        : body.shippingAdjustmentStatus ??
          (body.shippingFee !== undefined
            ? 'CUSTOMER_CONFIRMATION_PENDING'
            : existingOrder.shippingAdjustmentStatus || 'CUSTOMER_CONFIRMATION_PENDING');
      const nextPaymentProofUrl = body.paymentProofUrl ?? existingOrder.paymentProofUrl;
      const nextCourierName = body.courierName ?? existingOrder.courierName;
      const nextTrackingNumber = body.trackingNumber ?? existingOrder.trackingNumber;
      const nextWaFollowedUp = body.waFollowedUp ?? existingOrder.waFollowedUp;
      const resolvedAdjustmentStatuses = [
        'NONE',
        'CUSTOMER_CONFIRMED',
        'REFUNDED',
        'REFUND_WAIVED'
      ];

      if (body.waFollowedUp === true) {
        if (currentStatus === 'WAITING_PAYMENT' && !nextPaymentProofUrl) {
          throw new OrderWorkflowError(
            'Bukti pembayaran wajib diunggah sebelum mengonfirmasi WhatsApp pembayaran'
          );
        }
        if (currentStatus === 'PAID') {
          if (!nextCourierName?.trim() || !nextTrackingNumber?.trim()) {
            throw new OrderWorkflowError(
              'Kurir dan nomor resi wajib disimpan sebelum mengonfirmasi WhatsApp pengiriman'
            );
          }
          if (!resolvedAdjustmentStatuses.includes(adjustmentStatus)) {
            throw new OrderWorkflowError(
              'Penyesuaian ongkir harus diselesaikan sebelum mengonfirmasi WhatsApp pengiriman'
            );
          }
        }
      }

      if (newStatus && newStatus !== currentStatus) {
        if (!allowedStatusTransitions[currentStatus]?.includes(newStatus)) {
          throw new OrderWorkflowError(
            `Status tidak dapat diubah langsung dari ${currentStatus} ke ${newStatus}`,
            409
          );
        }

        if (currentStatus === 'PENDING' && newStatus === 'WAITING_PAYMENT' && !nextWaFollowedUp) {
          throw new OrderWorkflowError(
            'Konfirmasi pengiriman WhatsApp order dan tagihan wajib diselesaikan terlebih dahulu'
          );
        }
        if (currentStatus === 'WAITING_PAYMENT' && newStatus === 'PAID') {
          if (!nextPaymentProofUrl) {
            throw new OrderWorkflowError('Bukti pembayaran wajib diunggah sebelum menandai lunas');
          }
          if (!nextWaFollowedUp) {
            throw new OrderWorkflowError(
              'WhatsApp konfirmasi pembayaran wajib dikirim sebelum menandai lunas'
            );
          }
        }
        if (currentStatus === 'PAID' && newStatus === 'FULFILLED') {
          if (!nextCourierName?.trim() || !nextTrackingNumber?.trim()) {
            throw new OrderWorkflowError('Kurir dan nomor resi wajib diisi sebelum pengiriman');
          }
          if (!resolvedAdjustmentStatuses.includes(adjustmentStatus)) {
            throw new OrderWorkflowError(
              'Penyesuaian ongkir harus diselesaikan sebelum menyelesaikan pengiriman'
            );
          }
          if (!nextWaFollowedUp) {
            throw new OrderWorkflowError(
              'WhatsApp nomor resi wajib dikirim sebelum menyelesaikan pengiriman'
            );
          }
        }

        const paidStatuses = ['PAID', 'FULFILLED'];
        const wasPaid = paidStatuses.includes(currentStatus);
        const isNowPaid = paidStatuses.includes(newStatus);
        if (!wasPaid && isNowPaid) {
          await deductStock(existingOrder.items, tx);
        } else if (wasPaid && !isNowPaid) {
          await restoreStock(existingOrder.items, tx);
        }
      }

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
    if (error instanceof OrderWorkflowError) {
      return NextResponse.json(
        { code: error.statusCode, status: 'error', message: error.message },
        { status: error.statusCode }
      );
    }
    const isClientError = errorMessage.includes('tidak mencukupi') || errorMessage.includes('tidak ditemukan') || errorMessage.includes('wajib diunggah');
    return NextResponse.json(
      { code: isClientError ? 400 : 500, status: 'error', message: errorMessage },
      { status: isClientError ? 400 : 500 }
    );
  }
}
