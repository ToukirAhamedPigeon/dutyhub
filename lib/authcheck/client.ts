/**
 * Client-side permission check using localStorage
 */
export function can(
  permissionArray: string[],
  checkType: 'any' | 'all' = 'all'
): boolean {
  try {
    const stored = localStorage.getItem('permissions')
    const userPermissions: string[] = stored ? JSON.parse(stored) : []

    if (checkType === 'any') {
      return permissionArray.some((perm) => userPermissions.includes(perm))
    }

    return permissionArray.every((perm) => userPermissions.includes(perm))
  } catch (err) {
    console.error('Client permission check failed:', err)
    return false
  }
}