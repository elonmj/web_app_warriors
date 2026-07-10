import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, ADMIN_SESSION_COOKIE } from '@/lib/adminSession';

export async function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname;

  // List of protected paths
  const protectedPaths = [
    '/admin/events',
    '/admin/players',
    '/admin/matches',
    '/admin/logs'
  ];

  // Check if the path is protected and if the user has a valid admin session
  if (protectedPaths.some(prefix => path.startsWith(prefix))) {
    const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const isAuthorized = await verifySessionToken(sessionCookie);

    if (!isAuthorized) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // Allow the request to continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/events/:path*',
    '/admin/players/:path*',
    '/admin/matches/:path*',
    '/admin/logs/:path*'
  ],
};
