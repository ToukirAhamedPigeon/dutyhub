import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/database/mongoose';
import User from '@/lib/database/models/user.model';
import Role from '@/lib/database/models/role.model';
import Permission from '@/lib/database/models/permission.model';
import RolePermission from '@/lib/database/models/rolePermission.model';
import { IUser, IRole, IPermission, IRolePermission } from '@/types';
import { Types } from 'mongoose';
import { checkUserAccess } from '@/lib/authcheck/server';

function extractId(value: unknown): string {
  if (value instanceof Types.ObjectId) {
    return value.toString();
  } else if (typeof value === 'object' && value !== null && '_id' in value) {
    const obj = value as { _id: Types.ObjectId };
    return obj._id.toString();
  } else {
    throw new Error('Invalid value passed to extractId');
  }
}

export async function POST(req: NextRequest) {
  try {
    const authCheck = await checkUserAccess(req, ['manage_permissions'])
    if (!authCheck.authorized) {
      return authCheck.response
    }

    await dbConnect();

   

    const body = await req.json();

    const {
      q = '',
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc',
      name = '',
      guard_name = '',
      role_ids = [],
    } = body;

    const skip = (page - 1) * limit;
    const sortDir = sortOrder === 'desc' ? -1 : 1;

    const filterQuery: any = {};
    if (name) filterQuery.name = { $regex: name, $options: 'i' };
    if (guard_name) filterQuery.guard_name = { $regex: guard_name, $options: 'i' };

    const globalSearchQuery = q
      ? {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { guard_name: { $regex: q, $options: 'i' } },
          ],
        }
      : {};

    const finalQuery = { $and: [globalSearchQuery, filterQuery] };

    let permissions = await Permission.find(finalQuery)
      .sort({ [sortBy]: sortDir })
      .skip(skip)
      .limit(limit)
      .lean<IPermission[]>();

    let totalCount = await Permission.countDocuments(finalQuery);
    let permissionIds = permissions.map((p) => p._id);

    const rolePermissions = await RolePermission.find({
      permission_id: { $in: permissionIds },
    }).lean<IRolePermission[]>();

    // Filter by permission_ids if provided
    if (role_ids.length > 0) {
      const permissionIdToRoles: Record<string, string[]> = {};
      for (const rp of rolePermissions) {
        const pid = rp.permission_id.toString();
        const rid = extractId(rp.role_id);
        if (!permissionIdToRoles[pid]) permissionIdToRoles[pid] = [];
        permissionIdToRoles[pid].push(rid);
      }

      const matchedPermissionIds = Object.entries(permissionIdToRoles)
        .filter(([_, rids]) => rids.some((rid) => role_ids.includes(rid)))
        .map(([pid]) => pid);

      permissions = permissions.filter((p) => matchedPermissionIds.includes(p._id.toString()));
      permissionIds = permissions.map((p) => p._id);
      totalCount = permissions.length;
    }

    // Get all unique permission_ids
    const roleIdSet = new Set<string>();
    for (const rp of rolePermissions) {
      if (permissionIds.some((id) => id.toString() === rp.permission_id.toString())) {
        roleIdSet.add(extractId(rp.role_id));
      }
    }
    const allRoleIds = [...roleIdSet];

    const roles = await Role.find({
      _id: { $in: allRoleIds },
    }).lean<IRole[]>();

    const roleMap = Object.fromEntries(
      roles.map((p) => [p._id.toString(), p])
    );

    // Fetch users for created_by and updated_by
    const userIds = new Set<string>();
    for (const permission of permissions) {
      if (permission.created_by) userIds.add(extractId(permission.created_by));
      if (permission.updated_by) userIds.add(extractId(permission.updated_by));
    }

    const users = await User.find({
      _id: { $in: [...userIds] },
    }).lean<IUser[]>();

    const userMap = Object.fromEntries(
      users.map((u) => [u._id.toString(), u.name])
    );

    // Assemble final formatted data
    const formatted = permissions.map((permission) => {
      const pid = permission._id.toString();
      const rls = rolePermissions
        .filter((rp) => rp.permission_id.toString() === pid)
        .map((rp) => roleMap[extractId(rp.role_id)])
        .filter((r): r is IRole => !!r);

      return {
        ...permission,
        created_by_name: userMap[extractId(permission.created_by)] || null,
        updated_by_name: userMap[extractId(permission.updated_by)] || null,
        roles: rls.map((r) => ({ _id: r._id.toString(), name: r.name })),
        roleNames: rls.map((r) => r.name).join(', '),
        role_ids: rls.map((r) => r._id.toString()),
      };
    });

    return NextResponse.json({ permissions: formatted, totalCount });
  } catch (err) {
    console.error('Error in permission fetch:', err);
    return NextResponse.json({ error: 'Invalid token or server error' }, { status: 403 });
  }
}