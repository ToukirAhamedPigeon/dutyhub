/**
 * Middleware: Permission-Based Route Protection
 *
 * Purpose:
 * This middleware protects specific routes based on user permissions. It reads a
 * cookie called `user-permissions` and checks if the user has the required permission
 * to access a given route. If not, it redirects the user to a 401 (Unauthorized) page.
 */

import { NextRequest, NextResponse } from 'next/server'; // Import Next.js request/response types for middleware

// Define required permissions for specific routes
const routePermissions: Record<string, string> = {
  '/admin/dashboard': 'manage_dashboard', // Accessing /admin/users requires 'manage_users' permission
  '/admin/users': 'manage_users', // Accessing /admin/users requires 'manage_users' permission
  '/admin/roles': 'manage_roles', // Accessing /admin/roles requires 'manage_roles' permission
  '/admin/permissions': 'manage_permissions', // Accessing /admin/roles requires 'manage_roles' permission
};

// Middleware function that runs on every request
export function middleware(req: NextRequest) {
  const url = req.nextUrl.pathname; // Extract the path from the request URL
  const required = routePermissions[url]; // Look up required permission for the path

  // If the route doesn't require a specific permission, allow access
  if (!required) return NextResponse.next();

  const cookie = req.cookies.get('user-permissions'); // Get the user's permissions from cookies
  // If no cookie found, redirect to unauthorized page
  if (!cookie) return NextResponse.redirect(new URL('/401', req.url));

  const permissions = JSON.parse(cookie.value || '[]'); // Parse the permissions from the cookie

  // If the required permission is not included in the user's permissions, deny access
  if (!permissions.includes(required)) return NextResponse.redirect(new URL('/401', req.url));

  // User has the required permission; allow the request to proceed
  return NextResponse.next();
}
