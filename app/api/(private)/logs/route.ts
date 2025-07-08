import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/database/mongoose';
import User from '@/lib/database/models/user.model';
import Log from '@/lib/database/models/log.model';
import { checkUserAccess } from '@/lib/authcheck/server';
import { Types } from 'mongoose';
import { ILog, IUser } from '@/types';

function extractId(value: unknown): string {
  if (value instanceof Types.ObjectId) {
    return value.toString();
  } else if (typeof value === 'object' && value !== null && '_id' in value) {
    return (value as { _id: Types.ObjectId })._id.toString();
  } else {
    throw new Error('Invalid value passed to extractId');
  }
}

export async function POST(req: NextRequest) {
  try {
    const authCheck = await checkUserAccess(req, ['read-logs']);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    await dbConnect();
    const body = await req.json();

    const {
      q = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      collectionName = [],
      actionType = [],
      createdBy = [],
      createdAtFrom = '',
      createdAtTo = '',
    } = body;

    const skip = (page - 1) * limit;
    const sortDir = sortOrder === 'desc' ? -1 : 1;

    const filterQuery: any = {};

    // Global search
    const globalSearch = q
      ? {
          $or: [
            { detail: { $regex: q, $options: 'i' } },
            { collectionName: { $regex: q, $options: 'i' } },
            { actionType: { $regex: q, $options: 'i' } },
          ],
        }
      : {};

    // collectionName (Array of strings)
    if (Array.isArray(collectionName) && collectionName.length > 0) {
      filterQuery.collectionName = { $in: collectionName };
    }

    // actionType (Array of strings)
    if (Array.isArray(actionType) && actionType.length > 0) {
      filterQuery.actionType = { $in: actionType };
    }

    // createdBy (Array of ObjectId strings)
    if (Array.isArray(createdBy) && createdBy.length > 0) {
      const validUserIds = createdBy
        .filter((id: string) => Types.ObjectId.isValid(id))
        .map((id: string) => new Types.ObjectId(id));
      if (validUserIds.length > 0) {
        filterQuery.createdBy = { $in: validUserIds };
      }
    }

  
    // Date filtering logic
    const now = new Date();
    let rawFrom = createdAtFrom ? new Date(createdAtFrom) : new Date(now.toISOString().split('T')[0]);
    let rawTo = createdAtTo ? new Date(createdAtTo) : new Date(now.toISOString().split('T')[0]);

    // Swap if needed
    if (rawTo < rawFrom) {
      const temp = rawFrom;
      rawFrom = rawTo;
      rawTo = temp;
    }

    // Now set hours
    rawFrom.setHours(0, 0, 0, 0);
    rawTo.setHours(23, 59, 59, 999);


    filterQuery.createdAt = { $gte: rawFrom, $lte: rawTo };

    const finalQuery = { $and: [globalSearch, filterQuery] };

    const logs = await Log.find(finalQuery)
    .sort({ [sortBy]: sortDir })
    .skip(skip)
    .limit(limit)
    .lean<ILog[]>();

    const totalCount = await Log.countDocuments(finalQuery);

    // Fetch user names
    const userIds = [...new Set(logs.map((log) => extractId(log.createdBy)))];
    const users = await User.find({ _id: { $in: userIds } }).lean<IUser[]>();
    const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u.name]));

    // Format result
    const formattedLogs = logs.map((log) => ({
      ...log,
      _id: log._id.toString(),
      createdByName: userMap[extractId(log.createdBy)] || null,
    }));

    return NextResponse.json({ logs: formattedLogs, totalCount });
  } catch (err) {
    console.error('Error in fetch-logs:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
