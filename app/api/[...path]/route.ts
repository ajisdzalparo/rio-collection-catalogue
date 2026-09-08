import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/config/env';

async function handleProxy(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  const pathStr = params.path ? params.path.join('/') : '';
  const searchParams = request.nextUrl.search;

  // Resolve target absolute URL
  let targetUrl: string;
  if (env.backendUrl.startsWith('http')) {
    targetUrl = `${env.backendUrl.replace(/\/$/, '')}/${pathStr}${searchParams}`;
  } else {
    const origin = request.nextUrl.origin || 'http://localhost:3000';
    targetUrl = `${origin}/api/v1/${pathStr}${searchParams}`;
  }

  const token = request.cookies.get('auth_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');

  const headers: Record<string, string> = {
    'Content-Type': request.headers.get('content-type') || 'application/json',
    'Accept': request.headers.get('accept') || 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      body = await request.text();
    } catch {
      body = undefined;
    }
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store'
    });

    const data = await response.text();
    const proxyResponse = new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json'
      }
    });

    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      proxyResponse.headers.set('Set-Cookie', setCookieHeader);
    }

    return proxyResponse;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'BFF Proxy Error: Failed to communicate with backend service.',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, props);
}

export async function POST(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, props);
}

export async function PUT(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, props);
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, props);
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, props);
}
