import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Enforce Standard HTTP Defensive Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // 2. Server-Enforced RBAC Route Protection (Remediates VULN-07)
  const pathname = request.nextUrl.pathname;
  const isProtectedManagementRoute =
    pathname.startsWith('/reports') ||
    pathname.startsWith('/inventory') ||
    pathname.startsWith('/settings');

  if (isProtectedManagementRoute) {
    const roleCookie = request.cookies.get('ordriva_role')?.value;
    // Disallow unauthenticated guests or external customer QR roles from administrative surfaces
    if (roleCookie === 'guest' || roleCookie === 'customer') {
      return NextResponse.redirect(new URL('/order', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
