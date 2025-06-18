'use client';

import { signOut } from 'next-auth/react';
import { useDispatch } from 'react-redux';
import { clearPermissions } from '@/store/permissionsSlice';

const Dashboard = () => {
  const dispatch = useDispatch();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    localStorage.removeItem('user-permissions');
    localStorage.clear();
    dispatch(clearPermissions());
    window.location.href = '/login';
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
