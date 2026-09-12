import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCustomerFromRequest } from '@/lib/customer-auth';
import { customerProfileSchema } from '@/lib/customer-profile-schema';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const customer = await getCustomerFromRequest(request);
    if (!customer) {
      return NextResponse.json(
        { code: 401, status: 'error', message: 'Sesi login tidak valid atau telah berakhir.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: customer
    });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal memuat profil customer.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const customer = await getCustomerFromRequest(request);
    if (!customer) {
      return NextResponse.json(
        { code: 401, status: 'error', message: 'Sesi login tidak valid atau telah berakhir.' },
        { status: 401 }
      );
    }

    const parsed = customerProfileSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        {
          code: 400,
          status: 'error',
          message: 'Data profil tidak valid. Email dan nomor WhatsApp tidak dapat diubah dari form ini.',
          details: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: parsed.data
    });

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: updated
    });
  } catch (error) {
    console.error('Error updating customer profile:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal memperbarui profil customer.' },
      { status: 500 }
    );
  }
}
