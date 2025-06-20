import { Session } from 'next-auth';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setAuthUser } from '@/store/authUserSlice';
import { setPermissions } from '@/store/permissionsSlice';
import { setRoles } from '@/store/rolesSlice'; // <- You need this action

export function useAuthUser(session: Session | null) {
  const dispatch = useDispatch();

  useEffect(() => {
    const init = async () => {
      const authUserCache = localStorage.getItem('authUser');
      const permissionCache = localStorage.getItem('permissions');
      const roleCache = localStorage.getItem('roles');

      if (authUserCache && permissionCache && roleCache) {
        const authUser = JSON.parse(authUserCache);
        const permissions = JSON.parse(permissionCache);
        const roles = JSON.parse(roleCache);
        dispatch(setAuthUser(authUser));
        dispatch(setPermissions(permissions));
        dispatch(setRoles(roles));
      } else if (session) {
        const res = await fetch('/api/auth/userData');
        const data = await res.json();

        localStorage.setItem('authUser', JSON.stringify(data.authUser));
        localStorage.setItem('permissions', JSON.stringify(data.permissions));
        localStorage.setItem('roles', JSON.stringify(data.roles));

        dispatch(setAuthUser(data.authUser));
        dispatch(setPermissions(data.permissions));
        dispatch(setRoles(data.roles));
      }
    };

    init();
  }, [session]);
}
