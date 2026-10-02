import { NextRequest, NextResponse } from 'next/server';
import { calculateShippingCost } from '@/lib/rajaongkir';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit('shipping-cost', ip, {
    windowMs: 60_000,
    maxRequests: 30
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        code: 429,
        status: 'error',
        message: `Terlalu banyak permintaan kalkulasi ongkir. Silakan coba lagi dalam ${rateLimit.retryAfterSeconds} detik.`
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { destination, destinationType, weight, courier, origin, originType } = body;

    if (!destination || !courier) {
      return NextResponse.json(
        { code: 400, status: 'error', message: 'Destination and courier are required' },
        { status: 400 }
      );
    }

    const results = await calculateShippingCost({
      origin,
      originType,
      destination,
      destinationType,
      weight: Number(weight) || 1000,
      courier: String(courier)
    });

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: results
    });
  } catch (error) {
    console.error('Error calculating shipping cost:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: `Failed to calculate shipping cost: ${error instanceof Error ? error.message : String(error)}`, data: [] },
      { status: 500 }
    );
  }
}
