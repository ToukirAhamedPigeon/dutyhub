// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '../../(public)/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import { verifyAccessToken } from '@/lib/jwt';
import { dbConnect } from '@/lib/database/mongoose';
import User from '@/lib/database/models/user.model';
import ModelRole from '@/lib/database/models/modelRole.model';
import Role from '@/lib/database/models/role.model';
import { IUser,IRole } from '@/types';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.split(' ')[1]

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const decoded = verifyAccessToken(token);

  try {
    const decoded = verifyAccessToken(token);
    if (!decoded || typeof decoded !== 'object' || !('id' in decoded)) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
    }
  
    const session = await getServerSession(authOptions);
  
    if (!session || !session.user || !session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    await dbConnect();

const { searchParams } = new URL(req.url);
const q = searchParams.get("q") || "";
const page = parseInt(searchParams.get("page") || "1", 10);
const limit = parseInt(searchParams.get("limit") || "10", 10);
const skip = (page - 1) * limit;

const sortBy = searchParams.get("sortBy") || "createdAt";
const sortOrder = searchParams.get("sortOrder") === "desc" ? -1 : 1;

const searchQuery = q
  ? {
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { decryptedPassword: { $regex: q, $options: "i" } },
      ],
    }
  : {};

const [users, totalCount] = await Promise.all([
  User.find(searchQuery)
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit)
    .lean<IUser[]>(),
  User.countDocuments(searchQuery),
]);

// Step 2: Get all user IDs
const userIds = users.map((user) => user._id);

// Step 3: Fetch model roles for these users
const modelRoles = await ModelRole.find({
  model_type: "User",
  model_id: { $in: userIds },
}).lean();

// Step 4: Fetch unique role IDs and get role names
const roleIds = modelRoles.map((modelRole) => modelRole.role_id);
const roles = await Role.find({ _id: { $in: roleIds } }).lean<IRole[]>();

// Step 5: Build lookup maps
const roleMap = Object.fromEntries(roles.map((role) => [role._id.toString(), role.name]));
const userRoleMap: Record<string, string[]> = {};

modelRoles.forEach((mr) => {
  const uid = mr.model_id.toString();
  const roleName = roleMap[mr.role_id.toString()];
  if (roleName) {
    if (!userRoleMap[uid]) userRoleMap[uid] = [];
    userRoleMap[uid].push(roleName);
  }
});

// Step 6: Attach roleNames to each user
const formatted = users.map((user) => ({
  ...user,
  roleNames: (userRoleMap[user._id.toString()] || []).join(", "),
}));

return NextResponse.json({ users: formatted, totalCount });

  } catch (err) {
    console.error('Auth or DB error:', err)
    return NextResponse.json({ error: 'Invalid token or server error' }, { status: 403 })
  }
}
