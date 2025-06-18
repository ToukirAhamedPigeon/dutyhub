import { Session, getServerSession } from 'next-auth';
import { authOptions } from './[...nextauth]';
import { dbConnect } from '@/lib/database/mongoose';
import ModelRole from '@/lib/database/models/modelRole.model';
import RolePermission from '@/lib/database/models/rolePermission.model';
import ModelPermission from '@/lib/database/models/modelPermission.model';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req:NextApiRequest, res:NextApiResponse) {
  const session = await getServerSession(req, res, authOptions) as Session | null;
  if (!session || !session.user || !session.user.id) {
    return res.status(401).end();
  }

  await dbConnect();
  const userId = session.user.id;

  const roles = await ModelRole.find({ model_id: userId });
  const roleIds = roles.map(r => r.role_id);
  const rolePermissions = await RolePermission.find({ role_id: { $in: roleIds } });
  const rolePermissionIds = rolePermissions.map(rp => rp.permission_id.toString());

  const directPermissions = await ModelPermission.find({ model_id: userId });
  const directPermissionIds = directPermissions.map(p => p.permission_id.toString());

  const mergedPermissions = Array.from(new Set([...rolePermissionIds, ...directPermissionIds]));

  res.json({ permissions: mergedPermissions });
}
