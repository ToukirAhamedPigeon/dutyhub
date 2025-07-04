import { NextResponse, NextRequest } from 'next/server'
import { authOptions } from '@/app/api/(public)/auth/[...nextauth]/route'
import { getServerSession } from 'next-auth'
import { verifyAccessToken } from '@/lib/jwt'
import { dbConnect } from '@/lib/database/mongoose'
import User from '@/lib/database/models/user.model'
import { uploadAndResizeImage } from '@/lib/imageUploder'
import { getCreatedAtId } from '@/lib/formatDate'
import { omitFields } from '@/lib/helpers'
import { logAction } from '@/lib/logger'
import bcrypt from 'bcryptjs'
import { EActionType } from '@/types'
import { customAssignPermissionsToModelBatch, customAssignRolesToModelBatch } from '@/lib/authorization'

export async function POST(req: NextRequest) {
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
    const userPermissionsCookie = req.cookies.get('user-permissions')?.value;
    if (!userPermissionsCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userPermissions: string[] = JSON.parse(userPermissionsCookie);
    if (!userPermissions.includes('manage_users')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const formData = await req.formData();

    const name = formData.get('name') as string;
    const username = formData.get('username') as string;
    const email = formData.get('email')?.toString();
    const password = formData.get('password') as string;
    const confirmed_password = formData.get('confirmed_password') as string;
    const current_status = formData.get('current_status') as string;

    const phone_1 = formData.get('phone_1')?.toString();
    if (!phone_1) {
      return NextResponse.json({ success: false, message: "Phone number is required" }, { status: 400 });
    }

    if (password !== confirmed_password) {
      return NextResponse.json({ success: false, message: "Passwords do not match" }, { status: 400 });
    }

    // Check for duplicate email or username
    const query: any = { $or: [{ username }] };
    if (email) query.$or.push({ email });

    const existingUser = await User.findOne(query);
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'Email or username already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData: any = {
      name,
      email,
      username,
      password: hashedPassword,
      decrypted_password: password,
      current_status,
      phone_1,
    };

    // Optional fields
    const optionalFields = [
      'bp_no',
      'phone_2',
      'address',
      'blood_group',
      'nid',
      'dob',
      'description',
    ];
    for (const field of optionalFields) {
      const val = formData.get(field);
      if (val) userData[field] = val;
    }

    const file = formData.get('image') as File

    const newUser = await User.create(userData)

    await User.findByIdAndUpdate(
      newUser._id,
      { dateTimeFormatId: getCreatedAtId(newUser.created_at) },
      { new: true, strict: false }
    )

    const role_ids = JSON.parse(formData.get('role_ids') as string) as string[];
    const permission_ids = JSON.parse(formData.get('permission_ids') as string) as string[];

    let newAssignedRoleInfos=customAssignRolesToModelBatch(newUser._id, role_ids, 'User')
    let newAssignedPermissionInfos=customAssignPermissionsToModelBatch(newUser._id, permission_ids, 'User')

    // Handle image upload
    if (file && file.size > 0 && file.type.startsWith('image/')) {
        const { imageUrl } = await uploadAndResizeImage({
          file,
          modelFolder: 'users',
          isResize: true, // or false based on use case
          width: 400,     // optionally set
          height: 400,  // optionally set if needed
          // Optionally, pass custom filename
          baseName: newUser.name
        })
      
        newUser.image = imageUrl  
        await newUser.save()
      }

    // Log the action
    await logAction({
      detail: `User created: ${newUser.name}`,
      changes: JSON.stringify({
        after: omitFields(newUser.toObject?.() || newUser, [
          'password',
          'decrypted_password',
          '__v',
        ]),
      }),
      actionType: EActionType.CREATE,
      collectionName: 'User',
      objectId: newUser._id.toString(),
    })

    return NextResponse.json({ success: true, user: newUser, newAssignedRoleInfos, newAssignedPermissionInfos }, { status: 201 })
  } catch (err: any) {
    console.error('User Registration Error:', err)
    return NextResponse.json(
      { success: false, message: err?.message || 'Registration failed' },
      { status: err.name === 'JsonWebTokenError' ? 403 : 500 }
    )
  }
}
