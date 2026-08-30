import { NextRequest, NextResponse } from 'next/server';
import { fetchCities } from '@/lib/rajaongkir';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provinceId = searchParams.get('provinceId') || undefined;
    const provinceName = searchParams.get('provinceName') || undefined;

    const cities = await fetchCities(provinceId, provinceName);
    return NextResponse.json({
      code: 200,
      status: 'success',
      data: cities
    });
  } catch (error) {
    console.error('Error fetching shipping cities:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to fetch cities', data: [] },
      { status: 500 }
    );
  }
}
