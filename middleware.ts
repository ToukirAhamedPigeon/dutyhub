import { NextRequest, NextResponse } from 'next/server';

const routePermissions: Record<string, string> = {
  '/admin/dashboard': 'manage_dashboard',
  '/admin/users': 'manage_users',
  '/admin/roles': 'manage_roles',
  '/admin/permissions': 'manage_permissions',
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const sessionCookie = req.cookies.get('next-auth.session-token') || req.cookies.get('__Secure-next-auth.session-token');
  const permissionsCookie = req.cookies.get('user-permissions');

  // Redirect root path "/" to "/login" or "/admin/dashboard" if logged in
  if (pathname === '/') {
    return NextResponse.redirect(new URL(sessionCookie ? '/admin/dashboard' : '/login', req.url));
  }

  // If user accesses /login and is already logged in, redirect to /admin/dashboard
  if (pathname === '/login' && sessionCookie) {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url));
  }

  // Redirect "/admin" to "/admin/dashboard"
  if (pathname === '/admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url));
  }

  // Protect routes that require specific permissions
  const requiredPermission = routePermissions[pathname];
  if (requiredPermission) {
    if (!sessionCookie || !permissionsCookie) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const userPermissions = JSON.parse(permissionsCookie.value || '[]');
    if (!userPermissions.includes(requiredPermission)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  return NextResponse.next();
}

// Define what paths this middleware applies to
export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'], // Protect everything except Next.js internals and API
};