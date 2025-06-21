import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt'; 
import User from '@/lib/database/models/user.model';
import { dbConnect } from '@/lib/database/mongoose';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyAccessToken(token); // throws if invalid

    if (!decoded || typeof decoded !== 'object' || !('id' in decoded)) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Optional: clear refresh token from DB
    user.refreshToken = '';
    await user.save();

    const response = NextResponse.json({ message: 'Logged out' });

    // Clear any custom cookies
    response.cookies.set('user-permissions', '', {
      path: '/',
      maxAge: 0,
    });

    response.cookies.set('user-roles', '', {
      path: '/',
      maxAge: 0,
    });

    response.cookies.set('auth-user', '', {
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
