import { Session } from 'next-auth';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPermissions } from '@/store/permissionsSlice';
import { setRoles } from '@/store/rolesSlice'; // <- You need this action

export function useUserPermissions(session: Session | null) {
  const dispatch = useDispatch();

  useEffect(() => {
    const init = async () => {
      const permCache = localStorage.getItem('permissions');
      const roleCache = localStorage.getItem('roles');

      if (permCache && roleCache) {
        const permissions = JSON.parse(permCache);
        const roles = JSON.parse(roleCache);
        dispatch(setPermissions(permissions));
        dispatch(setRoles(roles));
      } else if (session) {
        const res = await fetch('/api/auth/permissions');
        const data = await res.json();

        localStorage.setItem('permissions', JSON.stringify(data.permissions));
        localStorage.setItem('roles', JSON.stringify(data.roles));

        dispatch(setPermissions(data.permissions));
        dispatch(setRoles(data.roles));
      }
    };

    init();
  }, [session]);
}
