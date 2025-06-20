import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';
import { dbConnect } from '@/lib/database/mongoose';

import ModelRole from '@/lib/database/models/modelRole.model';
import RolePermission from '@/lib/database/models/rolePermission.model';
import ModelPermission from '@/lib/database/models/modelPermission.model';
import User from '@/lib/database/models/user.model'; // Assuming user names are in this model
import Role from '@/lib/database/models/role.model'; // Assuming role names are in this model
import Permission from '@/lib/database/models/permission.model'; // Assuming permission names are here

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  await dbConnect();
  const userId = session.user.id;

  const authUser = await User.findById(userId).select(
    '-password -decrypted_password -created_at -created_by -updated_by -username'
  );

  const roles = await ModelRole.find({ model_id: userId });
  const roleIds = roles.map(r => r.role_id);

  const roleData = await Role.find({ _id: { $in: roleIds } }); // Get role names
  const roleNames = roleData.map(role => role.name);

  const rolePermissions = await RolePermission.find({ role_id: { $in: roleIds } });
  const rolePermissionIds = rolePermissions.map(rp => rp.permission_id.toString());

  const directPermissions = await ModelPermission.find({ model_id: userId });
  const directPermissionIds = directPermissions.map(p => p.permission_id.toString());

  const permissionIds = Array.from(new Set([...rolePermissionIds, ...directPermissionIds]));
  const permissionData = await Permission.find({ _id: { $in: permissionIds } }); // Get permission names
  const permissionNames = permissionData.map(p => p.name);

  const response = NextResponse.json({
    authUser: authUser,
    permissions: permissionNames,
    roles: roleNames,
  });

  // 🍪 Set cookie so middleware can use this
  response.cookies.set('auth-user', JSON.stringify(authUser), {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
    maxAge: 60 * 60 * 24,
  });

  response.cookies.set('user-permissions', JSON.stringify(permissionNames), {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
    maxAge: 60 * 60 * 24,
  });

  response.cookies.set('user-roles', JSON.stringify(roleNames), {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
    maxAge: 60 * 60 * 24,
  });

  return response;
}
