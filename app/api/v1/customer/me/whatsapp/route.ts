import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCustomerFromRequest } from '@/lib/customer-auth';
import { normalizeWhatsapp } from '@/lib/customer-identity';
import {
  whatsappChangeConfirmSchema,
  whatsappChangeRequestSchema
} from '@/lib/customer-profile-schema';
import { requestOtp, verifyOtp, OtpError } from '@/lib/otp';

export const dynamic = 'force-dynamic';

function invalidWhatsappResponse() {
  return NextResponse.json(
    {
      code: 400,
      status: 'error',
      message: 'Nomor WhatsApp tidak valid. Gunakan format 08xx atau 628xx.'
    },
    { status: 400 }
  );
}

export async function POST(request: Request) {
  try {
    const customer = await getCustomerFromRequest(request);
    if (!customer) {
      return NextResponse.json(
        { code: 401, status: 'error', message: 'Sesi login tidak valid atau telah berakhir.' },
        { status: 401 }
      );
    }

    const parsed = whatsappChangeRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return invalidWhatsappResponse();

    const whatsapp = normalizeWhatsapp(parsed.data.whatsapp);
    if (!/^62\d{7,13}$/.test(whatsapp)) return invalidWhatsappResponse();
    if (whatsapp === normalizeWhatsapp(customer.whatsapp || '')) {
      return NextResponse.json(
        { code: 409, status: 'error', message: 'Nomor WhatsApp baru masih sama dengan nomor saat ini.' },
        { status: 409 }
      );
    }

    const result = await requestOtp({ email: customer.email, type: 'PHONE_CHANGE' });
    return NextResponse.json({
      code: 200,
      status: 'success',
      data: result
    });
  } catch (error) {
    if (error instanceof OtpError) {
      return NextResponse.json(
        { code: error.status, status: 'error', message: error.message },
        { status: error.status }
      );
    }
    console.error('Error sending WhatsApp change OTP:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal mengirim kode OTP pergantian nomor.' },
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

    const parsed = whatsappChangeConfirmSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        {
          code: 400,
          status: 'error',
          message: 'Nomor WhatsApp atau kode OTP tidak valid.',
          details: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const whatsapp = normalizeWhatsapp(parsed.data.whatsapp);
    if (!/^62\d{7,13}$/.test(whatsapp)) return invalidWhatsappResponse();

    await verifyOtp({
      email: customer.email,
      code: parsed.data.otpCode,
      type: 'PHONE_CHANGE',
      consume: true
    });

    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: { whatsapp }
    });

    return NextResponse.json({ code: 200, status: 'success', data: updated });
  } catch (error) {
    if (error instanceof OtpError) {
      return NextResponse.json(
        { code: error.status, status: 'error', message: error.message },
        { status: error.status }
      );
    }
    console.error('Error updating customer WhatsApp:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal memperbarui nomor WhatsApp.' },
      { status: 500 }
    );
  }
}
