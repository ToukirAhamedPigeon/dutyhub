import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/database/mongoose';
import { Types } from 'mongoose'
import { IPermission, IRole} from '@/types';
import Role from '@/lib/database/models/role.model';
import { omitFields } from '@/lib/helpers'
import { logAction } from '@/lib/logger'
import { EActionType } from '@/types'
import { customAssignPermissionsToRoleBatch,removePermissionsOfRoleBatch } from '@/lib/authorization'
import { checkReferenceBeforeDelete } from '@/lib/checkRefBeforeDelete';
import { checkUserAccess } from '@/lib/authcheck/server';
import RolePermission from '@/lib/database/models/rolePermission.model';
import Permission from '@/lib/database/models/permission.model';


export async function GET(req:NextRequest, { params }: {params: Promise<{ id: string }>}) {
      try {
        const authCheck = await checkUserAccess(req, ['manage_roles'])
        if (!authCheck.authorized) {
          return authCheck.response
        }
        const { id } = await params;
        await dbConnect()

        if (!Types.ObjectId.isValid(id)) {
          return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 })
        }

        try {
            const role = await Role.findById(id).lean<IRole>()

            if (!role) {
              return NextResponse.json({ error: 'Role not found' }, { status: 404 })
            }

            const rolePermissions = await RolePermission.find({
              role_id: role._id,
            }).lean();
            const permissionIds = rolePermissions.map((rp) => rp.permission_id);
            const permissions = await Permission.find({ _id: { $in: permissionIds } }).lean<IPermission[]>();

             // Directly get role names from roles
            const permissionNames = permissions.map((permission) => permission.name).join(", ");

            const formattedRole = {
              ...role,
              permissionNames,
              permission_ids:permissionIds,
            };

            return NextResponse.json(formattedRole)
          } catch (err) {
            console.error('Error fetching role detail:', err)
            return NextResponse.json({ error: 'Server error' }, { status: 500 })
          }
        } catch (err) {
          return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
        }
}

export async function PATCH(req:NextRequest, { params }: {params: Promise<{ id: string }>}) {
  try {
    const authCheck = await checkUserAccess(req, ['manage_users'])
    if (!authCheck.authorized) {
      return authCheck.response
    }

    const { id } = await params;
    const roleId = id
    await dbConnect()
    const formData = await req.formData()

    const role = await Role.findById(roleId)
    if (!role) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }
    const originalRole = role.toObject();

    const updatableFields = [
      'name',
      'guard_name'
    ]

    for (const field of updatableFields) {
      const val = formData.get(field)
      if (val !== null) role[field] = val
    }

    role.updated_by = authCheck.userId
    role.updated_at = new Date()
    await role.save()

    // Handle roles and permissions
 
    const permission_ids = JSON.parse(formData.get('permission_ids') as string || '[]') as string[]
    const newAssignedPermissionInfos = customAssignPermissionsToRoleBatch(role._id.toString(), permission_ids)

    // Log the update
    await logAction({
      detail: `Role updated: ${role.name}`,
      changes: JSON.stringify({
        before: omitFields(originalRole, ['created_by','created_at']),
        after: omitFields(role.toObject?.() || role, ['created_by','created_at']),
      }),
      actionType: EActionType.UPDATE,
      collectionName: 'User',
      objectId: roleId,
    })

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully',
      role,
      newAssignedPermissionInfos,
    })
  } catch (err: any) {
    console.error('Role Update Error:', err)
    return NextResponse.json(
      { success: false, message: err?.message || 'Update failed' },
      { status: err.name === 'JsonWebTokenError' ? 403 : 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }:  {params: Promise<{ id: string }>}) {
  try {
    const authCheck = await checkUserAccess(req, ['manage_users'])
    if (!authCheck.authorized) {
      return authCheck.response
    }

    const { id: roleId } = await params;
    await dbConnect();

    const role = await Role.findById(roleId);
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const originalRole = role.toObject();

    // 🔍 Reference check
    const refCheck = await checkReferenceBeforeDelete(roleId, [
      // { collectionName: 'RolePermission', columnNames: ['role_id'] },
      // { collectionName: 'ModelRole', columnNames: ['role_id'] },
    ]);

    if (refCheck) {
      return NextResponse.json({
        error: 'Cannot delete role due to existing reference.',
        reference: refCheck,
      }, { status: 400 });
    }


    await removePermissionsOfRoleBatch(role._id.toString());

    await role.deleteOne();

    await logAction({
      detail: `User deleted: ${originalRole.name}`,
      actionType: EActionType.DELETE,
      collectionName: 'User',
      objectId: roleId,
      changes: JSON.stringify({
        before: omitFields(originalRole, ['created_by', 'created_at']),
        after: null,
      }),
    });

    return NextResponse.json({ success: true, status: 'deleted', message: 'User deleted successfully' });

  } catch (err: any) {
    console.error('Delete Role Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Delete failed' },
      { status: err.name === 'JsonWebTokenError' ? 403 : 500 }
    );
  }
}


