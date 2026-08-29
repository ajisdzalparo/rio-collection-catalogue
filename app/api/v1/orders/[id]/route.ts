import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes, courierName, trackingNumber, notes } = body;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(adminNotes !== undefined && { notes: adminNotes }),
        ...(courierName !== undefined && { notes: `Courier: ${courierName}` }),
        ...(trackingNumber !== undefined && { notes: `Tracking: ${trackingNumber}` })
      },
      include: { items: true }
    });

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to update order' },
      { status: 500 }
    );
  }
}
