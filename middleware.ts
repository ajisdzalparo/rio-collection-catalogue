import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Check if accessing protected dashboard routes
  const isDashboardRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/users');
  const isAuthRoute = pathname === '/login';

  if (isDashboardRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && token) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/users/:path*', '/login']
};
