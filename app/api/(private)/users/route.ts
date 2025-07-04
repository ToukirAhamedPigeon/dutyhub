import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/(public)/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import { verifyAccessToken } from '@/lib/jwt';
import { dbConnect } from '@/lib/database/mongoose';
import User from '@/lib/database/models/user.model';
import ModelRole from '@/lib/database/models/modelRole.model';
import Role from '@/lib/database/models/role.model';
import ModelPermission from '@/lib/database/models/modelPermission.model';
import Permission from '@/lib/database/models/permission.model';
import RolePermission from '@/lib/database/models/rolePermission.model';
import { IUser, IRole, IPermission, IRolePermission } from '@/types';
import mongoose, { Types } from 'mongoose';

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
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = verifyAccessToken(token);
    if (!decoded || typeof decoded !== 'object' || !('id' in decoded)) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userPermissionsCookie = req.cookies.get('user-permissions')?.value;
    const userRolesCookie = req.cookies.get('user-roles')?.value;

    if (!userPermissionsCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userPermissions: string[] = JSON.parse(userPermissionsCookie);
    const userRoles: string[] = userRolesCookie ? JSON.parse(userRolesCookie) : [];

    if (!userPermissions.includes('manage_users')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isDeveloper = userRoles.includes('developer');

    await dbConnect();

   

    const body = await req.json();

    const {
      q = '',
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc',
      name = '',
      email = '',
      username = '',
      phone = '',
      bp_no = '',
      nid = '',
      current_status = '',
      blood_group = [],
      role_ids = [],
    } = body;

    const skip = (page - 1) * limit;
    const sortDir = sortOrder === 'desc' ? -1 : 1;

    const filterQuery: any = {};
    if (name) filterQuery.name = { $regex: name, $options: 'i' };
    if (email) filterQuery.email = { $regex: email, $options: 'i' };
    if (username) filterQuery.username = { $regex: username, $options: 'i' };
    if (phone) {
      filterQuery.$or = [
        ...(filterQuery.$or || []),
        { phone_1: { $regex: phone, $options: 'i' } },
        { phone_2: { $regex: phone, $options: 'i' } },
      ];
    }
    if (bp_no) filterQuery.bp_no = { $regex: bp_no, $options: 'i' };
    if (nid) filterQuery.nid = { $regex: nid, $options: 'i' };
    if (current_status) filterQuery.current_status = current_status;
    if (blood_group.length > 0) filterQuery.blood_group = { $in: blood_group };

    const globalSearchQuery = q
      ? {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
            { username: { $regex: q, $options: 'i' } },
            { bp_no: { $regex: q, $options: 'i' } },
            { nid: { $regex: q, $options: 'i' } },
            { blood_group: { $regex: q, $options: 'i' } },
            { phone_1: { $regex: q, $options: 'i' } },
            { phone_2: { $regex: q, $options: 'i' } },
            { address: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
            { current_status: { $regex: q, $options: 'i' } },
          ],
        }
      : {};

    const finalQuery = { $and: [globalSearchQuery, filterQuery] };

    let users = await User.find(finalQuery)
      .sort({ [sortBy]: sortDir })
      .skip(skip)
      .limit(limit)
      .lean<IUser[]>();

    let totalCount = await User.countDocuments(finalQuery);
    let userIds = users.map((u) => u._id);

    const modelRoles = await ModelRole.find({
      model_type: 'User',
      model_id: { $in: userIds },
    }).lean();

    const modelPermissions = await ModelPermission.find({
      model_type: 'User',
      model_id: { $in: userIds },
    }).lean();

    if (role_ids.length > 0) {
      const userIdToRoles: Record<string, string[]> = {};
      for (const mr of modelRoles) {
        const uid = mr.model_id.toString();
        const rid = extractId(mr.role_id);
        if (!userIdToRoles[uid]) userIdToRoles[uid] = [];
        userIdToRoles[uid].push(rid);
      }

      const matchedUserIds = Object.entries(userIdToRoles)
        .filter(([_, rids]) => rids.some((rid) => role_ids.includes(rid)))
        .map(([uid]) => uid);

      users = users.filter((u) => matchedUserIds.includes(u._id.toString()));
      userIds = users.map((u) => u._id);
      totalCount = users.length;
    }

    const uniqueRoleIds = [...new Set(modelRoles.map((mr) => extractId(mr.role_id)))];
    const roles = await Role.find({ _id: { $in: uniqueRoleIds } }).lean<IRole[]>();
    const roleMap = Object.fromEntries(roles.map((r) => [r._id.toString(), r.name]));

    const uniquePermissionIds = [...new Set(modelPermissions.map(mp => extractId(mp.permission_id)))];
    const permissionsData = await Permission.find({ _id: { $in: uniquePermissionIds } }).lean<IPermission[]>();
    const permissionMapById = Object.fromEntries(permissionsData.map(p => [p._id.toString(), p.name]));

    const rolePermissions = await RolePermission.find({
      role_id: { $in: uniqueRoleIds }
    }).lean<IRolePermission[]>();

    const rolePermissionIds = [...new Set(rolePermissions.map(rp => extractId(rp.permission_id)))];
    const rolePermissionsData = await Permission.find({ _id: { $in: rolePermissionIds } }).lean<IPermission[]>();
    const rolePermissionMapById = Object.fromEntries(rolePermissionsData.map(p => [p._id.toString(), p.name]));

    const roleIdToPermissionNames: Record<string, string[]> = {};
    for (const rp of rolePermissions) {
      const roleId = extractId(rp.role_id);
      const permId = extractId(rp.permission_id);
      const pname = rolePermissionMapById[permId];
      if (!pname) continue;
      if (!roleIdToPermissionNames[roleId]) {
        roleIdToPermissionNames[roleId] = [];
      }
      if (!roleIdToPermissionNames[roleId].includes(pname)) {
        roleIdToPermissionNames[roleId].push(pname);
      }
    }

    const userRoleMap: Record<string, { ids: string[]; names: string[] }> = {};
    modelRoles.forEach((mr) => {
      const uid = mr.model_id.toString();
      const rid = extractId(mr.role_id);
      const roleName = roleMap[rid];
      if (!userRoleMap[uid]) {
        userRoleMap[uid] = { ids: [], names: [] };
      }
      userRoleMap[uid].ids.push(rid);
      if (roleName) userRoleMap[uid].names.push(roleName);
    });

    const userPermissionMap: Record<string, { ids: string[]; names: string[] }> = {};
    modelPermissions.forEach(mp => {
      const uid = mp.model_id.toString();
      const pid = extractId(mp.permission_id);
      const pname = permissionMapById[pid];
      if (!userPermissionMap[uid]) {
        userPermissionMap[uid] = { ids: [], names: [] };
      }
      userPermissionMap[uid].ids.push(pid);
      if (pname) {
        userPermissionMap[uid].names.push(pname);
      }
    });

    const formatted = users.map((user) => {
      const uid = user._id.toString();
      const roles = userRoleMap[uid] || { ids: [], names: [] };
      const perms = userPermissionMap[uid] || { ids: [], names: [] };

      // const role_ids = roles.ids.map((id, index) => ({
      //   value: id,
      //   label: roles.names[index] || '',
      // }));

      // const permission_ids = perms.ids.map((id, index) => ({
      //   value: id,
      //   label: perms.names[index] || '',
      // }));

      const role_ids = roles.ids; 
      const permission_ids = perms.ids; 

      const allRolePermissionNamesSet = new Set<string>();
      roles.ids.forEach(rid => {
        const rolePermNames = roleIdToPermissionNames[rid] || [];
        rolePermNames.forEach(name => allRolePermissionNamesSet.add(name));
      });
      const rolePermissionNames = Array.from(allRolePermissionNamesSet).sort().join(', ');

      return {
        ...user,
        decrypted_password: isDeveloper ? user.decrypted_password : '',
        roleNames: roles.names.join(', '),
        permissionNames: perms.names.join(', '),
        rolePermissionNames,
        role_ids,
        permissions: perms.names,
        permission_ids,
      };
    });

    return NextResponse.json({ users: formatted, totalCount });
  } catch (err) {
    console.error('Auth or DB error:', err);
    return NextResponse.json({ error: 'Invalid token or server error' }, { status: 403 });
  }
}
