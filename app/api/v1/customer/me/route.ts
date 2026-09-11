import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCustomerFromRequest } from '@/lib/customer-auth';

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

    const body = await request.json().catch(() => ({}));
    const {
      fullName,
      whatsapp,
      address,
      cityId,
      cityName,
      provinceName,
      district,
      postalCode
    } = body;

    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        fullName: fullName !== undefined ? fullName : customer.fullName,
        whatsapp: whatsapp !== undefined ? whatsapp : customer.whatsapp,
        address: address !== undefined ? address : customer.address,
        cityId: cityId !== undefined ? cityId : customer.cityId,
        cityName: cityName !== undefined ? cityName : customer.cityName,
        provinceName: provinceName !== undefined ? provinceName : customer.provinceName,
        district: district !== undefined ? district : customer.district,
        postalCode: postalCode !== undefined ? postalCode : customer.postalCode
      }
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
