import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyOtp, OtpError } from '@/lib/otp';
import { signCustomerToken, CUSTOMER_TOKEN_COOKIE } from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, code, fullName, whatsapp } = body;

    if (!email || !code) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Email dan kode OTP wajib diisi.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify OTP and mark as used
    await verifyOtp({ email: normalizedEmail, code, type: 'LOGIN', consume: true });

    // Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          email: normalizedEmail,
          fullName: fullName?.trim() || null,
          whatsapp: whatsapp?.trim() || null
        }
      });
    } else if (fullName || whatsapp) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          fullName: fullName?.trim() || customer.fullName,
          whatsapp: whatsapp?.trim() || customer.whatsapp
        }
      });
    }

    // Link any existing orders with this email to this customer
    await prisma.order.updateMany({
      where: {
        email: normalizedEmail,
        customerId: null
      },
      data: {
        customerId: customer.id
      }
    });

    const token = signCustomerToken({
      customerId: customer.id,
      email: customer.email
    });

    const response = NextResponse.json({
      code: 200,
      status: 'success',
      data: {
        customer,
        token
      }
    });

    response.cookies.set(CUSTOMER_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    return response;
  } catch (error) {
    if (error instanceof OtpError) {
      return NextResponse.json(
        { code: error.status, status: 'error', message: error.message },
        { status: error.status }
      );
    }
    console.error('Error verifying customer login OTP:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal memverifikasi OTP login.' },
      { status: 500 }
    );
  }
}
