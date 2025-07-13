import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/database/mongoose';
import { checkUserAccess } from '@/lib/authcheck/server';
import Lookup from '@/lib/database/models/lookup.model';
import User from '@/lib/database/models/user.model';
import { ILookup, IUser } from '@/types';
import { Types } from 'mongoose';
import { extractId } from '@/lib/helpers';



export async function POST(req: NextRequest) {
  try {
    const authCheck = await checkUserAccess(req, ['read-lookups']);
    if (!authCheck.authorized) return authCheck.response;

    await dbConnect();

    const body = await req.json();
    const {
      q = '',
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc',
      name = '',
      bn_name = '',
      parent_id = '',
      alt_parent_id = '',
    } = body;

    const skip = (page - 1) * limit;
    const sortDir = sortOrder === 'desc' ? -1 : 1;

    const filterQuery: any = {};
    if (name) filterQuery.name = { $regex: name, $options: 'i' };
    if (bn_name) filterQuery.bn_name = { $regex: bn_name, $options: 'i' };
    if (parent_id) filterQuery.parent_id = new Types.ObjectId(parent_id);
    if (alt_parent_id) filterQuery.alt_parent_id = new Types.ObjectId(alt_parent_id);

    const globalSearchQuery = q
      ? {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { bn_name: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
          ],
        }
      : {};

    const finalQuery = { $and: [globalSearchQuery, filterQuery] };

    const lookups = await Lookup.find(finalQuery)
      .sort({ [sortBy]: sortDir })
      .skip(skip)
      .limit(limit)
      .lean<ILookup[]>();

    const totalCount = await Lookup.countDocuments(finalQuery);

    // Collect all user and parent IDs for name mapping
    const userIds = new Set<string>();
    const parentIds = new Set<string>();
    const altParentIds = new Set<string>();

    for (const l of lookups) {
      if (l.created_by) userIds.add(extractId(l.created_by));
      if (l.updated_by) userIds.add(extractId(l.updated_by));
      if (l.parent_id) parentIds.add(extractId(l.parent_id));
      if (l.alt_parent_id) altParentIds.add(extractId(l.alt_parent_id));
    }

    const [users, parents, altParents] = await Promise.all([
      User.find({ _id: { $in: [...userIds] } }).lean<IUser[]>(),
      Lookup.find({ _id: { $in: [...parentIds] } }).lean<ILookup[]>(),
      Lookup.find({ _id: { $in: [...altParentIds] } }).lean<ILookup[]>(),
    ]);

    const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u.name]));
    const parentMap = Object.fromEntries(parents.map((p) => [p._id.toString(), p.name]));
    const altParentMap = Object.fromEntries(altParents.map((p) => [p._id.toString(), p.name]));

    const formatted = lookups.map((l) => ({
      ...l,
      creator_user_name: userMap[extractId(l.created_by)] || null,
      updater_user_name: userMap[extractId(l.updated_by)] || null,
      parent_name: l.parent_id ? parentMap[extractId(l.parent_id)] || null : null,
      alt_parent_name: l.alt_parent_id ? altParentMap[extractId(l.alt_parent_id)] || null : null,
    }));

    return NextResponse.json({ lookups: formatted, totalCount });
  } catch (err) {
    console.error('Error in lookup fetch:', err);
    return NextResponse.json({ error: 'Invalid token or server error' }, { status: 403 });
  }
}
