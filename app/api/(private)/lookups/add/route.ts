import { NextResponse, NextRequest } from 'next/server'
import { dbConnect } from '@/lib/database/mongoose'
import { getCreatedAtId } from '@/lib/formatDate'
import { omitFields } from '@/lib/helpers'
import { logAction } from '@/lib/logger'
import { EActionType } from '@/types'
import {  customAssignPermissionsToRoleBatch } from '@/lib/authorization'
import { checkUserAccess } from '@/lib/authcheck/server'
import Role from '@/lib/database/models/role.model'

export async function POST(req: NextRequest) {
  try {
    const authCheck = await checkUserAccess(req, ['create-roles']);
    if (!authCheck.authorized) return authCheck.response;

    await dbConnect();
    const formData = await req.formData();

    const rawNameInput = formData.get('name') as string;
    const guard_name = formData.get('guard_name') as string;
    const permission_ids = JSON.parse(formData.get('permission_ids') as string) as string[];

    // Split by "=" and filter empty names
    const roleNames = rawNameInput
      .split('=')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    const createdRoles = [];
    const skippedRoles = [];

    for (const name of roleNames) {
      // Check for duplicate
      const exists = await Role.findOne({ name });
      if (exists) {
        skippedRoles.push(name);
        continue;
      }

      // Create role
      const newRole = await Role.create({ name, guard_name });

      // Update createdAt format
      await Role.findByIdAndUpdate(
        newRole._id,
        { dateTimeFormatId: getCreatedAtId(newRole.created_at) },
        { new: true, strict: false }
      );

        newRole.created_by = authCheck.userId
        newRole.created_at = new Date()
        newRole.updated_by = authCheck.userId
        newRole.updated_at = new Date()
        await newRole.save()

      // Assign permissions
      const newAssignedPermissionInfos = customAssignPermissionsToRoleBatch(newRole._id, permission_ids);
      // Log
      await logAction({
        detail: `Role created: ${newRole.name}`,
        changes: JSON.stringify({
          after: omitFields(newRole.toObject?.() || newRole, [
            'created_by',
            'created_at',
          ]),
        }),
        actionType: EActionType.CREATE,
        collectionName: 'Role',
        objectId: newRole._id.toString(),
      });

      createdRoles.push({ role: newRole, permissions: newAssignedPermissionInfos });
    }

    return NextResponse.json({
      success: true,
      message: `${createdRoles.length} role(s) created, ${skippedRoles.length} skipped.`,
      createdRoles: createdRoles.map(r => r.role.name),
      skippedRoles,
    }, { status: 201 });
  } catch (err: any) {
    console.error('Role creation error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Role creation failed' },
      { status: err.name === 'JsonWebTokenError' ? 403 : 500 }
    );
  }
}
