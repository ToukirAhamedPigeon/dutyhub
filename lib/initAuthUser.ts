import { AppDispatch } from '@/store'; // adjust if needed
import { setAuthUser } from '@/store/authUserSlice';
import { setPermissions } from '@/store/permissionsSlice';
import { setRoles } from '@/store/rolesSlice';

export const initAuthUser = async (dispatch: AppDispatch) => {
  const authUserCache = localStorage.getItem('authUser');
  const permissionCache = localStorage.getItem('permissions');
  const roleCache = localStorage.getItem('roles');

  if (authUserCache && permissionCache && roleCache) {
    dispatch(setAuthUser(JSON.parse(authUserCache)));
    dispatch(setPermissions(JSON.parse(permissionCache)));
    dispatch(setRoles(JSON.parse(roleCache)));
  } else {
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
