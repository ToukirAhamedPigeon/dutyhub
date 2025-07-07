import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/app/api/(public)/auth/[...nextauth]/route';
import { dbConnect } from '@/lib/database/mongoose';
import { Types } from 'mongoose'
import { verifyAccessToken } from '@/lib/jwt';
import { getServerSession } from 'next-auth';
import ModelRole from '@/lib/database/models/modelRole.model';
import { IRole, IUser } from '@/types';
import Role from '@/lib/database/models/role.model';
import User from '@/lib/database/models/user.model'
import { deleteImageFromUrl, uploadAndResizeImage } from '@/lib/imageUploder'
import { omitFields } from '@/lib/helpers'
import { logAction } from '@/lib/logger'
import { EActionType } from '@/types'
import { customAssignPermissionsToModelBatch, customAssignRolesToModelBatch, removePermissionsOfModelBatch, removeRolesOfModelBatch } from '@/lib/authorization'
import { checkReferenceBeforeDelete } from '@/lib/checkRefBeforeDelete';
import { checkUserAccess } from '@/lib/authcheck/server';


export async function GET(req:NextRequest, { params }: {params: Promise<{ id: string }>}) {
      try {
        const authCheck = await checkUserAccess(req, ['read-users'])
        if (!authCheck.authorized) {
          return authCheck.response
        }
        const { id } = await params;
        await dbConnect()

        if (!Types.ObjectId.isValid(id)) {
          return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
        }

        try {
            const user = await User.findById(id).lean<IUser>()

            if (!user) {
              return NextResponse.json({ error: 'User not found' }, { status: 404 })
            }

            const modelRoles = await ModelRole.find({
              model_type: "User",
              model_id: user._id,
            }).lean();
            
            const roleIds = modelRoles.map((modelRole) => modelRole.role_id);
            const roles = await Role.find({ _id: { $in: roleIds } }).lean<IRole[]>();

             // Directly get role names from roles
            const roleNames = roles.map((role) => role.name).join(", ");

            const formattedUser = {
              ...user,
              roleNames,
              role_ids:roleIds,
            };

            return NextResponse.json(formattedUser)
          } catch (err) {
            console.error('Error fetching user detail:', err)
            return NextResponse.json({ error: 'Server error' }, { status: 500 })
          }
        } catch (err) {
          return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
        }
}

export async function PATCH(req:NextRequest, { params }: {params: Promise<{ id: string }>}) {
  try {
    const authCheck = await checkUserAccess(req, ['update-users'])
    if (!authCheck.authorized) {
      return authCheck.response
    }

    const { id } = await params;
    const userId = id
    await dbConnect()
    const formData = await req.formData()

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }
    const originalUser = user.toObject();

    const updatableFields = [
      'name',
      'username',
      'email',
      'current_status',
      'dob',
      'bp_no',
      'phone_1',
      'phone_2',
      'address',
      'blood_group',
      'nid',
      'description',
    ]

    for (const field of updatableFields) {
      const val = formData.get(field)
      if (val !== null) user[field] = val
    }

    // Handle image upload or deletion
    const file = formData.get('image') as File | null
    const isImageDeleted = formData.get('isImageDeleted') === 'true'

    if (isImageDeleted && user.image) {
      await deleteImageFromUrl(user.image)
      user.image = undefined
    }

    if (file && file.size > 0 && file.type.startsWith('image/')) {
      const { imageUrl } = await uploadAndResizeImage({
        file,
        modelFolder: 'users',
        isResize: true,
        width: 400,
        height: 400,
        baseName: user.name,
      })
      if(user.image){
        await deleteImageFromUrl(user.image)
      }
      user.image = imageUrl
    }
    user.updated_by = authCheck.userId
    user.updated_at = new Date()
    await user.save()

    // Handle roles and permissions
    const role_ids = JSON.parse(formData.get('role_ids') as string || '[]') as string[]
    const permission_ids = JSON.parse(formData.get('permission_ids') as string || '[]') as string[]

    const newAssignedRoleInfos = customAssignRolesToModelBatch(user._id.toString(), role_ids, 'User')
    const newAssignedPermissionInfos = customAssignPermissionsToModelBatch(user._id.toString(), permission_ids, 'User')

    // Log the update
    await logAction({
      detail: `User updated: ${user.name}`,
      changes: JSON.stringify({
        before: omitFields(originalUser, ['password', 'decrypted_password', 'createdAtId', '__v']),
        after: omitFields(user.toObject?.() || user, ['password', 'decrypted_password', 'createdAtId', '__v']),
      }),
      actionType: EActionType.UPDATE,
      collectionName: 'User',
      objectId: userId,
    })

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user,
      newAssignedRoleInfos,
      newAssignedPermissionInfos,
    })
  } catch (err: any) {
    console.error('User Update Error:', err)
    return NextResponse.json(
      { success: false, message: err?.message || 'Update failed' },
      { status: err.name === 'JsonWebTokenError' ? 403 : 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: {params: Promise<{ id: string }>}) {
  try {
    const authCheck = await checkUserAccess(req, ['delete-users'])
    if (!authCheck.authorized) {
      return authCheck.response
    }

    const { id: userId } = await params;
    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const originalUser = user.toObject();

    // 🔍 Reference check
    const refCheck = await checkReferenceBeforeDelete(userId, [
      { collectionName: 'Role', columnNames: ['created_by', 'updated_by'] },
      { collectionName: 'Log', columnNames: ['createdBy'] },
    ]);

    if (refCheck) {
      return NextResponse.json({
        error: 'Cannot delete user due to existing reference.',
        reference: refCheck,
      }, { status: 400 });
    }

    const modelRoles = await ModelRole.find({
      model_type: "User",
      model_id: user._id,
    }).lean();
    
    const roleIds = modelRoles.map((modelRole) => modelRole.role_id);
    const roles = await Role.find({ _id: { $in: roleIds } }).lean<IRole[]>();

    const hasDeveloperRole = roles.some(role => role.name === 'developer');
    if (hasDeveloperRole) {
      return NextResponse.json(
        { error: 'User with "developer" role cannot be deleted.' },
        { status: 403 }
      );
    }

    // 🧹 Clean up related data
    if (user.image) {
      await deleteImageFromUrl(user.image);
    }

    await removeRolesOfModelBatch(user._id.toString(), 'User');
    await removePermissionsOfModelBatch(user._id.toString(), 'User');

    await user.deleteOne();

    await logAction({
      detail: `User deleted: ${originalUser.name}`,
      actionType: EActionType.DELETE,
      collectionName: 'User',
      objectId: userId,
      changes: JSON.stringify({
        before: omitFields(originalUser, ['password', 'decrypted_password', '__v']),
        after: null,
      }),
    });

    return NextResponse.json({ success: true, status: 'deleted', message: 'User deleted successfully' });

  } catch (err: any) {
    console.error('Delete User Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Delete failed' },
      { status: err.name === 'JsonWebTokenError' ? 403 : 500 }
    );
  }
}


