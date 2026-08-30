import { NextRequest, NextResponse } from 'next/server';
import { fetchSubdistricts } from '@/lib/rajaongkir';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get('cityId');
    const cityName = searchParams.get('cityName') || undefined;

    const subdistricts = await fetchSubdistricts(cityId || '', cityName);
    return NextResponse.json({
      code: 200,
      status: 'success',
      data: subdistricts
    });
  } catch (error) {
    console.error('Error fetching shipping subdistricts:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to fetch subdistricts', data: [] },
      { status: 500 }
    );
  }
}
