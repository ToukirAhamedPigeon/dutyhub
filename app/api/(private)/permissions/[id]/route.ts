import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/database/mongoose';
import { Types } from 'mongoose'
import { IPermission, IRole} from '@/types';
import Role from '@/lib/database/models/role.model';
import { omitFields } from '@/lib/helpers'
import { logAction } from '@/lib/logger'
import { EActionType } from '@/types'
import { customAssignRolesToPermissionBatch,removeRolesOfPermissionBatch } from '@/lib/authorization'
import { checkReferenceBeforeDelete } from '@/lib/checkRefBeforeDelete';
import { checkUserAccess } from '@/lib/authcheck/server';
import RolePermission from '@/lib/database/models/rolePermission.model';
import Permission from '@/lib/database/models/permission.model';


export async function GET(req:NextRequest, { params }: {params: Promise<{ id: string }>}) {
      try {
        const authCheck = await checkUserAccess(req, ['manage_permissions'])
        if (!authCheck.authorized) {
          return authCheck.response
        }
        const { id } = await params;
        await dbConnect()

        if (!Types.ObjectId.isValid(id)) {
          return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 })
        }

        try {
            const permission = await Permission.findById(id).lean<IPermission>()

            if (!permission) {
              return NextResponse.json({ error: 'Permission not found' }, { status: 404 })
            }

            const rolePermissions = await RolePermission.find({
              permission_id: permission._id,
            }).lean();
            const roleIds = rolePermissions.map((rp) => rp.role_id);
            const roles = await Role.find({ _id: { $in: roleIds } }).lean<IRole[]>();

             // Directly get role names from roles
            const roleNames = roles.map((role) => role.name).join(", ");

            const formattedPermission = {
              ...permission,
              roleNames,
              role_ids:roleIds,
            };

            return NextResponse.json(formattedPermission)
          } catch (err) {
            console.error('Error fetching permission detail:', err)
            return NextResponse.json({ error: 'Server error' }, { status: 500 })
          }
        } catch (err) {
          return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
        }
}

export async function PATCH(req:NextRequest, { params }: {params: Promise<{ id: string }>}) {
  try {
    const authCheck = await checkUserAccess(req, ['manage_permissions'])
    if (!authCheck.authorized) {
      return authCheck.response
    }

    const { id } = await params;
    const permissionId = id
    await dbConnect()
    const formData = await req.formData()

    const permission = await Role.findById(permissionId)
    if (!permission) {
      return NextResponse.json({ success: false, message: 'Permission not found' }, { status: 404 })
    }
    const originalPermission = permission.toObject();

    const updatableFields = [
      'name',
      'guard_name'
    ]

    for (const field of updatableFields) {
      const val = formData.get(field)
      if (val !== null) permission[field] = val
    }

    permission.updated_by = authCheck.userId
    permission.updated_at = new Date()
    await permission.save()

    // Handle roles and permissions
 
    const role_ids = JSON.parse(formData.get('role_ids') as string || '[]') as string[]
    const newAssignedRoleInfos = customAssignRolesToPermissionBatch(permission._id.toString(), role_ids)

    // Log the update
    await logAction({
      detail: `Permission updated: ${permission.name}`,
      changes: JSON.stringify({
        before: omitFields(originalPermission, ['created_by','created_at']),
        after: omitFields(permission.toObject?.() || permission, ['created_by','created_at']),
      }),
      actionType: EActionType.UPDATE,
      collectionName: 'Permission',
      objectId: permissionId,
    })

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully',
      permission,
      newAssignedRoleInfos,
    })
  } catch (err: any) {
    console.error('Permission Update Error:', err)
    return NextResponse.json(
      { success: false, message: err?.message || 'Update failed' },
      { status: err.name === 'JsonWebTokenError' ? 403 : 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }:  {params: Promise<{ id: string }>}) {
  try {
    const authCheck = await checkUserAccess(req, ['manage_permissions'])
    if (!authCheck.authorized) {
      return authCheck.response
    }

    const { id: permissionId } = await params;
    await dbConnect();

    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
    }

    const originalPermission = permission.toObject();

    // 🔍 Reference check
    const refCheck = await checkReferenceBeforeDelete(permissionId, [
      // { collectionName: 'RolePermission', columnNames: ['role_id'] },
      // { collectionName: 'ModelRole', columnNames: ['role_id'] },
    ]);

    if (refCheck) {
      return NextResponse.json({
        error: 'Cannot delete permission due to existing reference.',
        reference: refCheck,
      }, { status: 400 });
    }


    await removeRolesOfPermissionBatch(permission._id.toString());

    await permission.deleteOne();

    await logAction({
      detail: `Permission deleted: ${originalPermission.name}`,
      actionType: EActionType.DELETE,
      collectionName: 'Permission',
      objectId: permissionId,
      changes: JSON.stringify({
        before: omitFields(originalPermission, ['created_by', 'created_at']),
        after: null,
      }),
    });

    return NextResponse.json({ success: true, status: 'deleted', message: 'Permission deleted successfully' });

  } catch (err: any) {
    console.error('Delete Permission Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Delete failed' },
      { status: err.name === 'JsonWebTokenError' ? 403 : 500 }
    );
  }
}


