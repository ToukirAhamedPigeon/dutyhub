import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/(public)/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import { verifyAccessToken } from '@/lib/jwt';
import { dbConnect } from '@/lib/database/mongoose';
import User from '@/lib/database/models/user.model';
import ModelRole from '@/lib/database/models/modelRole.model';
import Role from '@/lib/database/models/role.model';
import { IUser, IRole } from '@/types';

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

    // Build filter query
    const filterQuery: any = {};
    if (name) filterQuery.name = { $regex: name, $options: "i" };
    if (email) filterQuery.email = { $regex: email, $options: "i" };
    if (username) filterQuery.username = { $regex: username, $options: "i" };
    if (phone) {
      filterQuery.$or = [
        ...(filterQuery.$or || []),
        { phone_1: { $regex: phone, $options: "i" } },
        { phone_2: { $regex: phone, $options: "i" } },
      ];
    }
    if (bp_no) filterQuery.bp_no = { $regex: bp_no, $options: "i" };
    if (nid) filterQuery.nid = { $regex: nid, $options: "i" };
    if (current_status) filterQuery.current_status = current_status;
    if (blood_group.length > 0) filterQuery.blood_group = { $in: blood_group };

    // Global search query
    const globalSearchQuery = q
      ? {
          $or: [
            { name: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
            { username: { $regex: q, $options: "i" } },
            { bp_no: { $regex: q, $options: "i" } },
            { nid: { $regex: q, $options: "i" } },
            { blood_group: { $regex: q, $options: "i" } },
            { phone_1: { $regex: q, $options: "i" } },
            { phone_2: { $regex: q, $options: "i" } },
            { address: { $regex: q, $options: "i" } },
            { description: { $regex: q, $options: "i" } },
            { current_status: { $regex: q, $options: "i" } },
          ],
        }
      : {};

    // Combine queries
    const finalQuery = {
      $and: [globalSearchQuery, filterQuery],
    };

    // Step 1: Fetch users matching query
    let users = await User.find(finalQuery)
      .sort({ [sortBy]: sortDir })
      .skip(skip)
      .limit(limit)
      .lean<IUser[]>();

    let totalCount = await User.countDocuments(finalQuery);

    // Step 2: Get user IDs
    let userIds = users.map((user) => user._id);

    // Step 3: Get ModelRoles
    let modelRoles = await ModelRole.find({
      model_type: "User",
      model_id: { $in: userIds },
    }).lean();

    // Step 4: Apply role_ids filter manually if provided
    if (role_ids.length > 0) {
      const userIdToRoles: Record<string, string[]> = {};
      for (const mr of modelRoles) {
        const uid = mr.model_id.toString();
        if (!userIdToRoles[uid]) userIdToRoles[uid] = [];
        userIdToRoles[uid].push(mr.role_id.toString());
      }

      const matchedUserIds = Object.entries(userIdToRoles)
        .filter(([_, rids]) => rids.some((rid) => role_ids.includes(rid)))
        .map(([uid]) => uid);

      users = users.filter((u) => matchedUserIds.includes(u._id.toString()));
      userIds = users.map((u) => u._id);
      totalCount = users.length;
      modelRoles = modelRoles.filter((mr) => matchedUserIds.includes(mr.model_id.toString()));
    }

    // Step 5: Fetch Role names
    const uniqueRoleIds = [...new Set(modelRoles.map((mr) => mr.role_id.toString()))];
    const roles = await Role.find({ _id: { $in: uniqueRoleIds } }).lean<IRole[]>();

    const roleMap = Object.fromEntries(roles.map((r) => [r._id.toString(), r.name]));
    const userRoleMap: Record<string, string[]> = {};

    modelRoles.forEach((mr) => {
      const uid = mr.model_id.toString();
      const roleName = roleMap[mr.role_id.toString()];
      if (roleName) {
        if (!userRoleMap[uid]) userRoleMap[uid] = [];
        userRoleMap[uid].push(roleName);
      }
    });

    // Step 6: Format users with role names
    const formatted = users.map((user) => ({
      ...user,
      roleNames: (userRoleMap[user._id.toString()] || []).join(", "),
    }));

    return NextResponse.json({ users: formatted, totalCount });
  } catch (err) {
    console.error('Auth or DB error:', err);
    return NextResponse.json({ error: 'Invalid token or server error' }, { status: 403 });
  }
}
