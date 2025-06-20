// components/LogoutButton.tsx
'use client'

import { Button } from '../ui/button'
import { cn } from '@/lib/utils'
import { signOut } from 'next-auth/react';
import { useDispatch } from 'react-redux';
import { clearPermissions } from '@/store/permissionsSlice';
import { clearRoles } from '@/store/rolesSlice';
export default function LogoutButton({ variant, className, children }: { variant: 'default' | 'outline' | 'ghost' | 'link', className?: string, children: React.ReactNode }) {
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      // 1. Call your server logout API to clear cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
  
      // 2. Sign out of NextAuth (client side)
      await signOut({ redirect: false });
  
      // 3. Clear Redux store slices
      dispatch(clearPermissions());
      dispatch(clearRoles());
  
      // 4. Clear localStorage items
      localStorage.removeItem('permissions');
      localStorage.removeItem('roles');
  
      // 5. Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <Button variant={variant} onClick={handleLogout} className={cn(className,'')}>
      {children}
    </Button>
  )
}
