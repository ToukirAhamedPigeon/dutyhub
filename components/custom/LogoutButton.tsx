// components/LogoutButton.tsx
'use client'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'
import { signOut } from 'next-auth/react';
import { useDispatch } from 'react-redux';
import { clearPermissions } from '@/store/permissionsSlice';
import { clearRoles } from '@/store/rolesSlice';
import api from '@/lib/axios'
import { authorizationHeader } from '@/lib/tokens';
import { clearAuthUser } from '@/store/authUserSlice';
export default function LogoutButton({ variant, className, children }: { variant: 'default' | 'outline' | 'ghost' | 'link', className?: string, children: React.ReactNode }) {
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      const headers = await authorizationHeader();
      await api.post('/logout', {},{headers});
  
      await signOut({ redirect: false });
  
      dispatch(clearAuthUser());
      dispatch(clearPermissions());
      dispatch(clearRoles());
      localStorage.removeItem('authUser');
      localStorage.removeItem('permissions');
      localStorage.removeItem('roles');
  
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed', error);
    }
  }

  return (
    <Button variant={variant} onClick={handleLogout} className={cn(className,'')}>
      {children}
    </Button>
  )
}
