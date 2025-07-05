import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/database/mongoose';
import User from '@/lib/database/models/user.model';
import ModelRole from '@/lib/database/models/modelRole.model';
import Role from '@/lib/database/models/role.model';
import ModelPermission from '@/lib/database/models/modelPermission.model';
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
    const authCheck = await checkUserAccess(req, ['manage_roles'])
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
      permission_ids = [],
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

    let roles = await Role.find(finalQuery)
      .sort({ [sortBy]: sortDir })
      .skip(skip)
      .limit(limit)
      .lean<IRole[]>();

    let totalCount = await Role.countDocuments(finalQuery);
    let roleIds = roles.map((r) => r._id);

    const rolePermissions = await RolePermission.find({
      role_id: { $in: roleIds },
    }).lean<IRolePermission[]>();

    // Filter by permission_ids if provided
    if (permission_ids.length > 0) {
      const roleIdToPermissions: Record<string, string[]> = {};
      for (const rp of rolePermissions) {
        const rid = rp.role_id.toString();
        const pid = extractId(rp.permission_id);
        if (!roleIdToPermissions[rid]) roleIdToPermissions[rid] = [];
        roleIdToPermissions[rid].push(pid);
      }

      const matchedRoleIds = Object.entries(roleIdToPermissions)
        .filter(([_, pids]) => pids.some((pid) => permission_ids.includes(pid)))
        .map(([rid]) => rid);

      roles = roles.filter((r) => matchedRoleIds.includes(r._id.toString()));
      roleIds = roles.map((r) => r._id);
      totalCount = roles.length;
    }

    // Get all unique permission_ids
    const permissionIdSet = new Set<string>();
    for (const rp of rolePermissions) {
      if (roleIds.some((id) => id.toString() === rp.role_id.toString())) {
        permissionIdSet.add(extractId(rp.permission_id));
      }
    }
    const allPermissionIds = [...permissionIdSet];

    const permissions = await Permission.find({
      _id: { $in: allPermissionIds },
    }).lean<IPermission[]>();

    const permissionMap = Object.fromEntries(
      permissions.map((p) => [p._id.toString(), p])
    );

    // Fetch users for created_by and updated_by
    const userIds = new Set<string>();
    for (const role of roles) {
      if (role.created_by) userIds.add(extractId(role.created_by));
      if (role.updated_by) userIds.add(extractId(role.updated_by));
    }

    const users = await User.find({
      _id: { $in: [...userIds] },
    }).lean<IUser[]>();

    const userMap = Object.fromEntries(
      users.map((u) => [u._id.toString(), u.name])
    );

    // Assemble final formatted data
    const formatted = roles.map((role) => {
      const rid = role._id.toString();
      const perms = rolePermissions
        .filter((rp) => rp.role_id.toString() === rid)
        .map((rp) => permissionMap[extractId(rp.permission_id)])
        .filter((p): p is IPermission => !!p);

      return {
        ...role,
        created_by_name: userMap[extractId(role.created_by)] || null,
        updated_by_name: userMap[extractId(role.updated_by)] || null,
        permissions: perms.map((p) => ({ _id: p._id.toString(), name: p.name })),
        permissionNames: perms.map((p) => p.name).join(', '),
        permission_ids: perms.map((p) => p._id.toString()),
      };
    });

    return NextResponse.json({ roles: formatted, totalCount });
  } catch (err) {
    console.error('Error in role fetch:', err);
    return NextResponse.json({ error: 'Invalid token or server error' }, { status: 403 });
  }
}