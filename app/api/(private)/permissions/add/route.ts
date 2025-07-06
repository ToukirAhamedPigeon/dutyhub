import { NextResponse, NextRequest } from 'next/server'
import { dbConnect } from '@/lib/database/mongoose'
import { getCreatedAtId } from '@/lib/formatDate'
import { omitFields } from '@/lib/helpers'
import { logAction } from '@/lib/logger'
import { EActionType } from '@/types'
import { customAssignRolesToPermissionBatch } from '@/lib/authorization'
import { checkUserAccess } from '@/lib/authcheck/server'
import Permission from '@/lib/database/models/permission.model'

const CRUD_ACTIONS = ['read', 'create', 'update', 'delete'];

function expandPermissionName(input: string): string[] {
  // Handles: crud-p1=delete-p2 => [crud-p1, delete-p2]
  const tokens = input
    .split('=')
    .map((token) => token.trim())
    .filter(Boolean);

  const expanded: string[] = [];

  for (const token of tokens) {
    const [prefix, resource] = token.split('-');
    if (!resource) continue;

    if (prefix === 'crud') {
      expanded.push(...CRUD_ACTIONS.map(action => `${action}-${resource}`));
    } else {
      expanded.push(`${prefix}-${resource}`);
    }
  }

  return Array.from(new Set(expanded)); // Remove duplicates
}

export async function POST(req: NextRequest) {
  try {
    const authCheck = await checkUserAccess(req, ['manage_permissions']);
    if (!authCheck.authorized) return authCheck.response;

    await dbConnect();
    const formData = await req.formData();

    const rawNameInput = formData.get('name') as string;
    const guard_name = formData.get('guard_name') as string;
    const role_ids = JSON.parse(formData.get('role_ids') as string) as string[];

    // Expand permission names from raw input
    const permissionNames = expandPermissionName(rawNameInput);

    const createdPermissions = [];
    const skippedPermissions = [];

    for (const name of permissionNames) {
      const exists = await Permission.findOne({ name });
      if (exists) {
        skippedPermissions.push(name);
        continue;
      }

      const newPermission = await Permission.create({ name, guard_name });

      await Permission.findByIdAndUpdate(
        newPermission._id,
        { dateTimeFormatId: getCreatedAtId(newPermission.created_at) },
        { new: true, strict: false }
      );

      newPermission.created_by = authCheck.userId;
      newPermission.created_at = new Date();
      newPermission.updated_by = authCheck.userId;
      newPermission.updated_at = new Date();
      await newPermission.save();

      const newAssignedRoleInfos = customAssignRolesToPermissionBatch(newPermission._id, role_ids);

      await logAction({
        detail: `Permission created: ${newPermission.name}`,
        changes: JSON.stringify({
          after: omitFields(newPermission.toObject?.() || newPermission, [
            'created_by',
            'created_at',
          ]),
        }),
        actionType: EActionType.CREATE,
        collectionName: 'Permission',
        objectId: newPermission._id.toString(),
      });

      createdPermissions.push({ permission: newPermission, roles: newAssignedRoleInfos });
    }

    return NextResponse.json(
      {
        success: true,
        message: `${createdPermissions.length} permission(s) created, ${skippedPermissions.length} skipped.`,
        createdPermissions: createdPermissions.map(r => r.permission.name),
        skippedPermissions,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Permission creation error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Permission creation failed' },
      { status: err.name === 'JsonWebTokenError' ? 403 : 500 }
    );
  }
}
