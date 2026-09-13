import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { canViewActivityLogs, isSuperAdminRole, parseAuthCookieUser } from '@/lib/auth/roles';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Check if accessing protected dashboard routes
  const isDashboardRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/users');
  const isAuthRoute = pathname === '/login';
  const isSuperAdminFinanceRoute = pathname.startsWith('/dashboard/super-admin');
  const isActivityLogRoute = pathname.startsWith('/dashboard/activity-logs');

  if (isDashboardRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isSuperAdminFinanceRoute) {
    const user = parseAuthCookieUser(token);
    if (!user || !isSuperAdminRole(user.role) || user.status !== 'active') {
      return NextResponse.redirect(new URL('/forbidden', request.url));
    }
  }

  if (isActivityLogRoute) {
    const user = parseAuthCookieUser(token);
    if (!user || !canViewActivityLogs(user.role) || user.status !== 'active') {
      return NextResponse.redirect(new URL('/forbidden', request.url));
    }
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
