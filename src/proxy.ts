import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Enhanced Access Sentinel Middleware
 * Managing dual-token (Access/Refresh) authorization flow.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extracting modern token identifiers
  const accessToken = request.cookies.get('atelier_access_token');
  const refreshToken = request.cookies.get('atelier_refresh_token');
  const legacySession = request.cookies.get('atelier_session');

  const isAuthenticated = !!(accessToken || refreshToken || legacySession);
  const isLoginPage = pathname === '/login';

  // Define public assets and routes that don't require authentication
  const isPublicAsset = pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico';

  const isPublicRoute = pathname === '/' || 
    pathname.startsWith('/products') || 
    pathname.startsWith('/checkout') ||
    isLoginPage;

  if (isPublicAsset) {
    return NextResponse.next();
  }

  // Redirecting unauthenticated entities to the security nexus (Login)
  // Only protect routes that are NOT public
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    // Preserving the intended destination for post-auth redirection
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Preventing authenticated entities from re-entering the login gate
  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

/**
 * Configure matching paths for precise protection.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
