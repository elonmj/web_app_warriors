    import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname;

  // List of protected paths
  const protectedPaths = [
    '/admin/events',
    '/admin/players',
    '/admin/matches',
    '/admin/logs'
  ];

  // Check if the path is protected and if the user is coming from the admin dashboard
  if (protectedPaths.some(prefix => path.startsWith(prefix))) {
    const referer = request.headers.get('referer') || '';
    const isFromAdminDashboard = referer.includes('/admin');

    // If not coming from admin dashboard, redirect to admin home
    if (!isFromAdminDashboard) {
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
