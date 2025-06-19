'use client';

import { signOut } from 'next-auth/react';
import { useDispatch } from 'react-redux';
import { clearPermissions } from '@/store/permissionsSlice';
import { clearRoles } from '@/store/rolesSlice';

const Dashboard = () => {
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
    <div className="p-10">
      <h1 className="text-2xl mb-4">Welcome to the Dashboard</h1>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
