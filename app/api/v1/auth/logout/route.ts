import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    code: 200,
    status: 'success',
    message: 'Berhasil logout'
  });

  response.cookies.delete('auth_token');
  return response;
}
