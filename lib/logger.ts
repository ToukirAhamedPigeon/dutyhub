// lib/logger.ts
import Log from '@/lib/database/models/log.model'
import { EActionType, ILog } from '@/types'
import { dbConnect } from '@/lib/database/mongoose'
import { getAuthenticatedUserIdServer } from '@/lib/tokens'

interface LogInput {
  detail?: string;
  changes?: string;
  actionType: EActionType;
  collectionName: string;
  objectId?: string;
}

function normalizeChanges(changes: string | { before?: any; after?: any } | undefined) {
  if (!changes) return changes;

  let parsedChanges: { before?: Record<string, any>; after?: Record<string, any> };

  if (typeof changes === 'string') {
    try {
      parsedChanges = JSON.parse(changes);
    } catch (e) {
      console.error('Invalid JSON in changes:', changes);
      return changes;
    }
  } else {
    parsedChanges = changes;
  }

  const { before = {}, after = {} } = parsedChanges;
  const hasBefore = before && Object.keys(before).length > 0;
  const hasAfter = after && Object.keys(after).length > 0;

  if (hasBefore && hasAfter) {
    const filteredAfter: Record<string, any> = {};

    for (const key of Object.keys(after)) {
      const beforeVal = before[key];
      const afterVal = after[key];

      if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
        filteredAfter[key] = afterVal;
      }
    }

    return {
      before,
      after: filteredAfter,
    };
  }

  return parsedChanges;
}


export async function logAction({
  detail,
  changes,
  actionType,
  collectionName,
  objectId,
}: LogInput): Promise<ILog | null> {
  try {
    await dbConnect();

    const authUserId = await getAuthenticatedUserIdServer()

    const log = await Log.create({
      detail,
      changes: JSON.stringify(normalizeChanges(changes)),
      actionType,
      collectionName,
      objectId,
      createdBy: authUserId,
    });

    return log;
  } catch (error) {
    console.error('❌ Failed to log action:', error);
    return null;
  }
}


