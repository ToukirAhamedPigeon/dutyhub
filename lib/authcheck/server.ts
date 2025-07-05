import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/jwt';
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/(public)/auth/[...nextauth]/route';

/**
 * Server-side permission check using cookies
 */
export function can(
  req: NextRequest,
  permissionArray: string[],
  checkType: 'any' | 'all' = 'all'
): boolean {
  try {
    const cookieValue = req.cookies.get('user-permissions')?.value
    const userPermissions: string[] = cookieValue ? JSON.parse(cookieValue) : []

    if (checkType === 'any') {
      return permissionArray.some((perm) => userPermissions.includes(perm))
    }

    return permissionArray.every((perm) => userPermissions.includes(perm))
  } catch (err) {
    console.error('Server permission check failed:', err)
    return false
  }
}

/**
 * Full user access check on the server (for API & SSR)
 */
export async function checkUserAccess(
  req: NextRequest,
  requiredPermissions: string[] = [],
  checkType: 'any' | 'all' = 'all'
): Promise<
  | { authorized: true; userId: string }
  | { authorized: false; response: NextResponse }
> {
  const token = req.headers.get('authorization')?.split(' ')[1]
  const decoded = token ? verifyAccessToken(token) : null

  if (!decoded || typeof decoded !== 'object' || !('id' in decoded)) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Invalid token payload' }, { status: 401 }),
    }
  }

  const session = await getServerSession(authOptions)
  if (!session || !session.user || !session.user.id) {
    return {
      authorized: false,
      response: new NextResponse('Unauthorized', { status: 401 }),
    }
  }

  const hasPermission = can(req, requiredPermissions, checkType)
  if (!hasPermission) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { authorized: true, userId: decoded.id }
}
