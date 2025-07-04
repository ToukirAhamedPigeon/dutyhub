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
import { uploadAndResizeImage } from '@/lib/imageUploder'
import { omitFields } from '@/lib/helpers'
import { logAction } from '@/lib/logger'
import { EActionType } from '@/types'
import { customAssignPermissionsToModelBatch, customAssignRolesToModelBatch } from '@/lib/authorization'
import { ObjectId } from 'mongoose'


export async function GET(req:NextRequest, { params }: {params: Promise<{ id: string }>}) {
  const { id } = await params;
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.split(' ')[1]
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.split(' ')[1]

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const decoded = verifyAccessToken(token)
    if (!decoded || typeof decoded !== 'object' || !('id' in decoded)) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 })
    }

    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userPermissionsCookie = req.cookies.get('user-permissions')?.value
    if (!userPermissionsCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userPermissions: string[] = JSON.parse(userPermissionsCookie)
    if (!userPermissions.includes('manage_users')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const userId = params.id
    const formData = await req.formData()

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

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
      user.image = undefined // optionally also delete file from server or cloud here
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

      user.image = imageUrl
    }

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
        after: omitFields(user.toObject?.() || user, ['password', 'decrypted_password', '__v']),
      }),
      actionType: EActionType.UPDATE,
      collectionName: 'User',
      objectId: user._id.toString(),
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


// export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
//   const { id } = await params;
//   const authHeader = req.headers.get('authorization')
//   const token = authHeader?.split(' ')[1]

//   if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

//   try {
//     jwt.verify(token, process.env.ACCESS_SECRET!)
//     const userId = id
//     const formData = await req.formData()

//     const isImageDeleted = formData.get('isImageDeleted') === 'true'
//     const file = formData.get('profilePicture') as File | null
//     const password = formData.get('password') as string
//     const hashedPassword = await bcrypt.hash(password, 10)


//     await dbConnect()

//     const user = await User.findById(userId)

//     const updates: any = {
//       name: formData.get('name'),
//       email: formData.get('email'),
//       password: hashedPassword,
//       decryptedPassword: password,
//       role: formData.get('role'),
//       createdAtId: getCreatedAtId(user.createdAt),
//       isActive: formData.get('isActive') === 'true'
      
//     }

//     if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

//     // Handle image deletion
//     if (isImageDeleted && user.profilePicture) {
//       await deleteImage(user.profilePicture._id)
//       updates.profilePicture = null
//     }

//     // Handle new image upload
//     if (file && file.size > 0 && file.type.startsWith('image/')) {
//       const { imageDoc }: { imageDoc: typeof Image.prototype } = await uploadAndResizeImage(
//         {
//           file,
//           modelFolder: 'users', 
//           modelType: EModelType.User, 
//           modelId: user._id
//         }
//       )
//       updates.profilePicture = imageDoc._id
//     }

    
//     const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true, strict: false })
//     await logAction({
//       detail: `User updated: ${updatedUser.name}`,
//       changes: JSON.stringify({ before: omitFields(user.toObject?.() || user, ['password', 'decryptedPassword','createdAtId','__v']), after: omitFields(updatedUser.toObject?.() || updatedUser, ['password', 'decryptedPassword','createdAtId','__v']) }),
//       actionType: EActionType.UPDATE,
//       collectionName: 'User',
//       objectId: userId,
//     })

//     return NextResponse.json({ user: updatedUser })
//   } catch (err) {
//     console.error('Update error:', err)
//     const status = err instanceof Error && err.name === 'JsonWebTokenError' ? 403 : 500
//     return NextResponse.json({ error: 'Invalid or expired token' }, { status })
//   }
// }

// export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
//   const { id } = await params;
//   const userId = id
//   const authHeader = req.headers.get('authorization')
//   const token = authHeader?.split(' ')[1]

//   if (!token) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//   }

//   try {
//     jwt.verify(token, process.env.ACCESS_SECRET!)
//     await dbConnect()

//     const user = await User.findById(userId).populate('profilePicture')
//     if (!user) {
//       return NextResponse.json({ error: 'User not found' }, { status: 404 })
//     }

//     // 🛡️ Prevent deletion of developer users
//     if (user.role === EUserRole.DEVELOPER) {
//       return NextResponse.json({ error: EUserRole.DEVELOPER+' users cannot be deleted' }, { status: 403 })
//     }

//     // Check for references in other collections
//     const referenced = await Promise.any([
//       Zone.exists({ $or: [{ createdBy: userId }, { updatedBy: userId }] }),
//       Route.exists({ $or: [{ createdBy: userId }, { updatedBy: userId }] }),
//       Slot.exists({ $or: [{ createdBy: userId }, { updatedBy: userId }] }),
//       Allotment.exists({ $or: [{ createdBy: userId }, { updatedBy: userId }] }),
//       Log.exists({ createdBy: userId }),
//       Image.exists({ createdBy: userId }),
//     ])

//     if (referenced) {
//       user.isActive = false
//       await user.save()

//       const afterUser = await User.findById(userId)
//       // Log inactivation
//       await logAction({
//         detail: `User inactivated: ${user.name}`,
//         changes: JSON.stringify({ before:omitFields(user.toObject?.() || user, ['password', 'decryptedPassword','createdAtId','__v']), after: omitFields(afterUser.toObject?.() || afterUser, ['password', 'decryptedPassword','createdAtId','__v']) }),
//         actionType: EActionType.UPDATE,
//         collectionName: 'User',
//         objectId: user._id.toString(),
//       })
//       return NextResponse.json({ status: 'inactive' })
//     } else {
//       // Delete profile picture from database and file system
//       if (user.profilePicture?._id) {
//         await Image.findByIdAndDelete(user.profilePicture._id)

//         // Remove file from uploads folder
//         const filePath = path.join(process.cwd(), 'public', user.profilePicture.imageUrl || '')
//         if (fs.existsSync(filePath)) {
//           fs.unlinkSync(filePath)
//         }
//       }

//       await User.findByIdAndDelete(userId)
//       await logAction({
//         detail: `User deleted: ${user.name}`,
//         changes: JSON.stringify({ before: omitFields(user.toObject?.() || user, ['password', 'decryptedPassword','createdAtId','__v']) }),
//         actionType: EActionType.DELETE,
//         collectionName: 'User',
//         objectId: user._id.toString(),
//       })
//       return NextResponse.json({ status: 'deleted' })
//     }

//   } catch (err) {
//     console.error('Error:', err)
//     return NextResponse.json({ error: 'Server Error' }, { status: 500 })
//   }
// }
