import { AppDispatch } from '@/store'; // adjust if needed
import { setAuthUser } from '@/store/authUserSlice';
import { setPermissions } from '@/store/permissionsSlice';
import { setRoles } from '@/store/rolesSlice';
import api from '@/lib/axios'
import {authorizationHeader} from '@/lib/tokens'

export const initAuthUser = async (dispatch: AppDispatch, mustFetch:boolean=false) => {
  const authUserCache = localStorage.getItem('authUser');
  const permissionCache = localStorage.getItem('permissions');
  const roleCache = localStorage.getItem('roles');
  if (authUserCache && permissionCache && roleCache && !mustFetch) {
    dispatch(setAuthUser(JSON.parse(authUserCache)));
    dispatch(setPermissions(JSON.parse(permissionCache)));
    dispatch(setRoles(JSON.parse(roleCache)));
  } else {
    const headers = await authorizationHeader();
    const res = await api.get('/userData',{headers});  
    const data = res.data;

    localStorage.setItem('authUser', JSON.stringify(data.authUser));
    localStorage.setItem('permissions', JSON.stringify(data.permissions));
    localStorage.setItem('roles', JSON.stringify(data.roles));

    dispatch(setAuthUser(data.authUser));
    dispatch(setPermissions(data.permissions));
    dispatch(setRoles(data.roles));
  }
};
