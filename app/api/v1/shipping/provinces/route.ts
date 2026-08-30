import { NextResponse } from 'next/server';
import { fetchProvinces } from '@/lib/rajaongkir';

export async function GET() {
  try {
    const provinces = await fetchProvinces();
    return NextResponse.json({
      code: 200,
      status: 'success',
      data: provinces
    });
  } catch (error) {
    console.error('Error fetching shipping provinces:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to fetch provinces', data: [] },
      { status: 500 }
    );
  }
}
