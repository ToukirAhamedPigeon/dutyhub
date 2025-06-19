'use client'

import { useSelector } from 'react-redux'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PermissionRedirector() {
  const permissions = useSelector((state: any) => state.permissions)
  const router = useRouter()

  useEffect(() => {
    if (permissions && permissions.length > 0) {
      router.push('/admin/dashboard') // Redirect only when permissions are available
    }
  }, [permissions])

  return null
}