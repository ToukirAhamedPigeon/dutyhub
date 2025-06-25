import { NextRequest, NextResponse } from 'next/server';

const routePermissions: Record<string, string> = {
  '/admin/dashboard': 'manage_dashboard',
  '/admin/users': 'manage_users',
  '/admin/roles': 'manage_roles',
  '/admin/permissions': 'manage_permissions',
  '/admin/lookups': 'manage_lookups',
  '/admin/logs': 'manage_logs',
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const cleanPath = pathname.replace(/\/$/, '');

  const sessionCookie =
    req.cookies.get('next-auth.session-token') ||
    req.cookies.get('__Secure-next-auth.session-token');
  const permissionsCookie = req.cookies.get('user-permissions');

  // console.log('pathname:', pathname);
  // console.log('cleanPath:', cleanPath);
  // console.log('sessionCookie:', sessionCookie);
  // console.log('permissionsCookie:', permissionsCookie);

  // Handle root redirect
  if (pathname === '/') {
    const target = sessionCookie && permissionsCookie ? '/admin/dashboard' : '/login';
    return NextResponse.redirect(new URL(target, req.url));
  }

  // Already logged in and trying to visit /login
  if (pathname === '/login' && sessionCookie && permissionsCookie) {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url));
  }

  // Shortcut for /admin
  if (pathname === '/admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url));
  }

  // Match route and permission
  const matchedRoute = Object.keys(routePermissions).find((route) =>
    pathname.startsWith(route)
  );
  const requiredPermission = matchedRoute ? routePermissions[matchedRoute] : null;

  // If route requires permission
  if (requiredPermission) {
    if (!sessionCookie || !permissionsCookie) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    let userPermissions: string[] = [];
    try {
      userPermissions = JSON.parse(permissionsCookie.value || '[]');
    } catch (error) {
      console.error('Invalid permissions cookie:', permissionsCookie);
      return NextResponse.redirect(new URL('/login', req.url));
    }

    if (!userPermissions.includes(requiredPermission)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  // ✅ Allow request to proceed
  return NextResponse.next();
}

// Only match non-static, non-API paths
export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\..*).*)'],
};
