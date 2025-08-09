import { NextRequest, NextResponse } from 'next/server';

// Define admin-only routes
const ADMIN_ROUTES = ['/admin'];

// Define protected routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/chat', '/agents', '/workflows', '/mcp', '/account', '/settings', '/subscription', ...ADMIN_ROUTES];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check if the current route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if the current route is admin-only
  const isAdminRoute = ADMIN_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  // If it's not a protected route, allow access
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // For admin routes, we'll let the client-side AdminGuard handle the authorization
  // since we need to check the Convex database for admin status
  // The middleware just ensures the route is accessible for further processing
  
  // For now, we'll rely on client-side guards for admin authorization
  // In a production app, you might want to add server-side admin checking here
  // using a server-side authentication system or API route
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$|.*\\.webp$|sw\\.js|manifest\\.json).*)',
  ],
};