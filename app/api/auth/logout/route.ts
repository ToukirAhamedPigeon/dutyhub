import { NextResponse } from 'next/server';
import { signOut } from 'next-auth/react'; // Note: server-side signOut is tricky, you usually clear cookies manually

export async function POST(req: Request) {
  // If you use NextAuth, you might want to invalidate the session here
  // But since NextAuth signOut is client-side, let's just clear our custom cookies

  const response = NextResponse.json({ message: 'Logged out' });

  // Clear the cookies you set
  response.cookies.set('user-permissions', '', {
    path: '/',
    maxAge: 0,
  });

  response.cookies.set('user-roles', '', {
    path: '/',
    maxAge: 0,
  });

  // Optional: Also clear NextAuth cookies/session if needed here (advanced)
  // You could also just rely on client signOut for NextAuth session.

  return response;
}
